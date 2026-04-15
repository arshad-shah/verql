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
import type { KeyringAccess, SchemaAccess, ConnectionAccess } from '../plugins/sdk/types'

export interface AIModuleDeps {
  keyring: KeyringAccess
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
}

export function createAIModule(deps: AIModuleDeps): AIModule {
  const providerRegistry = new AIProviderRegistry()
  const toolRegistry = new AIToolRegistry()
  const permissionManager = new PermissionManager()

  // Register built-in providers
  const openai = new OpenAIProvider(() => {
    // KeyringAccess.retrieve is async but provider getApiKey expects sync for now
    // We'll store the key in a local cache on first retrieval
    return (deps.settingsStore.get('ai.openaiKey') as string) || null
  })
  const anthropic = new AnthropicProvider(() => {
    return (deps.settingsStore.get('ai.anthropicKey') as string) || null
  })

  const ollamaEndpoint = (deps.settingsStore.get('ai.ollamaEndpoint') as string) || undefined
  const ollama = new OllamaProvider(ollamaEndpoint)

  providerRegistry.register(openai)
  providerRegistry.register(anthropic)
  providerRegistry.register(ollama)

  // Restore active provider/model from settings
  const savedProvider = deps.settingsStore.get('ai.activeProvider') as string | undefined
  const savedModel = deps.settingsStore.get('ai.activeModel') as string | undefined
  if (savedProvider && providerRegistry.get(savedProvider)) {
    providerRegistry.setActive(savedProvider)
  }
  if (savedModel) {
    providerRegistry.setActiveModel(savedModel)
  }

  const conversationManager = new ConversationManager({
    providerRegistry,
    toolRegistry,
    permissionManager,
    getSchemaContext: async (connectionId) => {
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
    },
    getConnectionId: () => deps.connectionAccess.getActiveConnectionId()
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
        for await (const event of conversationManager.chat()) {
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

  deps.handle('ai:tools:list', async () => {
    return toolRegistry.list().map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      permission: t.permission
    }))
  })

  return { providerRegistry, toolRegistry, permissionManager, conversationManager }
}
