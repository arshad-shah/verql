// src/main/ai/index.ts
import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'
import type { AIStreamEvent } from '@shared/ai-types'
import { AIProviderRegistry } from './provider-registry'
import { AIToolRegistry } from './tool-registry'
import { PermissionManager } from './permission-manager'
import { ConversationManager } from './conversation-manager'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { OllamaProvider } from './providers/ollama'
import type { SchemaAccess, ConnectionAccess } from '../plugins/sdk/types'
import type { KeyringService } from '../keyring'
import { createAIEnhancements } from './enhancements'

const AI_KEYRING_NS = '__ai__'

export interface AIModuleDeps {
  keyring: KeyringService
  schemaAccess: SchemaAccess
  connectionAccess: ConnectionAccess
  handle: <K extends keyof IpcChannelMap>(
    channel: K,
    handler: (...args: IpcChannelMap[K]['args']) => IpcChannelMap[K]['return'] | Promise<IpcChannelMap[K]['return']>
  ) => void
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

export interface AIModule {
  providerRegistry: AIProviderRegistry
  toolRegistry: AIToolRegistry
  permissionManager: PermissionManager
  conversationManager: ConversationManager
  enhancements: ReturnType<typeof createAIEnhancements>
}

export function createAIModule(deps: AIModuleDeps): AIModule {
  const providerRegistry = new AIProviderRegistry()
  const toolRegistry = new AIToolRegistry()
  const permissionManager = new PermissionManager()

  // One-time migration: move legacy plaintext keys from settings.json into the keyring.
  for (const provider of ['openai', 'anthropic'] as const) {
    const legacy = deps.settingsStore.get(`ai.${provider}Key`) as string | undefined
    if (legacy && !deps.keyring.has(AI_KEYRING_NS, provider)) {
      deps.keyring.storeSync(AI_KEYRING_NS, provider, legacy)
    }
    if (legacy) deps.settingsStore.set(`ai.${provider}Key`, '')
  }

  const openai = new OpenAIProvider(() => deps.keyring.retrieveSync(AI_KEYRING_NS, 'openai'))
  const anthropic = new AnthropicProvider(() => deps.keyring.retrieveSync(AI_KEYRING_NS, 'anthropic'))

  const ollamaEndpoint = (deps.settingsStore.get('ai.ollamaEndpoint') as string) || undefined
  const ollama = new OllamaProvider(ollamaEndpoint)

  providerRegistry.register(openai)
  providerRegistry.register(anthropic)
  providerRegistry.register(ollama)

  // Restore active provider/model from settings, or auto-detect from configured keys
  const savedProvider = deps.settingsStore.get('ai.activeProvider') as string | undefined
  const savedModel = deps.settingsStore.get('ai.activeModel') as string | undefined
  if (savedProvider && providerRegistry.get(savedProvider)) {
    providerRegistry.setActive(savedProvider)
  } else {
    // Auto-select first provider that has an API key configured
    const anthropicKey = deps.keyring.has(AI_KEYRING_NS, 'anthropic')
    const openaiKey = deps.keyring.has(AI_KEYRING_NS, 'openai')
    if (anthropicKey) {
      providerRegistry.setActive('anthropic')
      deps.settingsStore.set('ai.activeProvider', 'anthropic')
    } else if (openaiKey) {
      providerRegistry.setActive('openai')
      deps.settingsStore.set('ai.activeProvider', 'openai')
    }
  }
  if (savedModel) {
    providerRegistry.setActiveModel(savedModel)
  } else if (providerRegistry.getActive()) {
    // Auto-select first model from the active provider
    providerRegistry.getActive()!.models().then(models => {
      if (models.length > 0) {
        providerRegistry.setActiveModel(models[0].id)
        deps.settingsStore.set('ai.activeModel', models[0].id)
      }
    })
  }

  const getSchemaContext = async (connectionId: string): Promise<string> => {
    try {
      const summary = await deps.schemaAccess.getSchemaSummary(connectionId)
      return summary.tables.map(t => {
        const cols = t.columns.map(c => {
          let desc = `${c.name} ${c.dataType}`
          if (c.isPrimaryKey) desc += ' PK'
          if (c.isForeignKey && c.references) desc += ` FK→${c.references.table}.${c.references.column}`
          return desc
        }).join(', ')
        return `${t.name}(${cols})`
      }).join('\n')
    } catch {
      return ''
    }
  }

  const conversationManager = new ConversationManager({
    providerRegistry,
    toolRegistry,
    permissionManager,
    getSchemaContext,
    getConnectionId: () => deps.connectionAccess.getActiveConnectionId()
  })

  const enhancements = createAIEnhancements({
    providerRegistry,
    getSchemaContext,
    conversationManager
  })

  // ─── Register IPC handlers ─────────────────────────────────────────────────

  const activeStreams = new Map<string, AbortController>()

  deps.handle('ai:chat:start', async (request) => {
    const streamId = randomUUID()
    const controller = new AbortController()
    activeStreams.set(streamId, controller)

    conversationManager.addUserMessage(request.message)

    // Run streaming in background, broadcast events to renderer
    ;(async () => {
      try {
        for await (const event of conversationManager.chat(request.connectionMeta)) {
          const win = BrowserWindow.getAllWindows()[0]
          if (win) win.webContents.send('ai:chat:event', streamId, event)
        }
      } catch (err) {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) win.webContents.send('ai:chat:event', streamId, {
          type: 'error',
          error: err instanceof Error ? err.message : String(err)
        } satisfies AIStreamEvent)
      } finally {
        activeStreams.delete(streamId)
      }
    })()

    return { streamId }
  })

  deps.handle('ai:chat:abort', async (streamId) => {
    const controller = activeStreams.get(streamId)
    if (controller) {
      controller.abort()
      activeStreams.delete(streamId)
    }
    conversationManager.abort()
  })

  deps.handle('ai:chat:approval-response', async (requestId, approved) => {
    permissionManager.resolveApproval(requestId, approved)
  })

  deps.handle('ai:providers:list', async () => {
    return providerRegistry.list().map(p => ({ id: p.id, name: p.name }))
  })

  deps.handle('ai:providers:list-configured', async () => {
    const configured: { id: string; name: string }[] = []
    if (deps.keyring.has(AI_KEYRING_NS, 'anthropic')) configured.push({ id: 'anthropic', name: 'Anthropic' })
    if (deps.keyring.has(AI_KEYRING_NS, 'openai')) configured.push({ id: 'openai', name: 'OpenAI' })

    // Check Ollama reachability
    const ollamaEndpoint = (deps.settingsStore.get('ai.ollamaEndpoint') as string) || 'http://localhost:11434'
    try {
      const resp = await fetch(`${ollamaEndpoint}/api/tags`, { signal: AbortSignal.timeout(2000) })
      if (resp.ok) configured.push({ id: 'ollama', name: 'Ollama' })
    } catch { /* unreachable */ }

    return configured
  })

  deps.handle('ai:providers:set-active', async (providerId) => {
    providerRegistry.setActive(providerId)
    deps.settingsStore.set('ai.activeProvider', providerId)
  })

  deps.handle('ai:providers:get-active', async () => {
    const active = providerRegistry.getActive()
    return active ? { id: active.id, name: active.name } : null
  })

  deps.handle('ai:models:list', async () => {
    const active = providerRegistry.getActive()
    if (!active) return []
    return active.models()
  })

  deps.handle('ai:models:set-active', async (modelId) => {
    providerRegistry.setActiveModel(modelId)
    deps.settingsStore.set('ai.activeModel', modelId)
  })

  deps.handle('ai:models:get-active', async () => {
    return providerRegistry.getActiveModel()
  })

  deps.handle('ai:messages:list', async () => {
    return conversationManager.getMessages()
  })

  deps.handle('ai:messages:clear', async () => {
    conversationManager.clearMessages()
  })

  deps.handle('ai:keys:has', async (provider) => {
    return deps.keyring.has(AI_KEYRING_NS, provider)
  })

  deps.handle('ai:keys:set', async (provider, value) => {
    deps.keyring.storeSync(AI_KEYRING_NS, provider, value)
  })

  deps.handle('ai:tools:list', async () => {
    return toolRegistry.list().map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      permission: t.permission
    }))
  })

  return { providerRegistry, toolRegistry, permissionManager, conversationManager, enhancements }
}
