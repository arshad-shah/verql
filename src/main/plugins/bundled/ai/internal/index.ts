// src/main/plugins/bundled/ai/internal/index.ts
//
// The AI core. Called from src/main/plugins/bundled/ai/index.ts at plugin
// activation time. Nothing in this module talks to Electron's `ipcMain`
// directly — the plugin's PluginContext provides ipc.handle + broadcast.
import { randomUUID } from 'crypto'
import type { AIStreamEvent } from '@shared/ai-types'
import { AIProviderRegistry } from './provider-registry'
import { AIToolRegistry } from './tool-registry'
import { PermissionManager } from './permission-manager'
import { ConversationManager } from './conversation-manager'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { OllamaProvider } from './providers/ollama'
import type { SchemaAccess, ConnectionAccess, PluginIpc, BroadcastFn, Disposable, KeyringAccess } from '../../../sdk/types'
import { createAIEnhancements } from './enhancements'

const AI_KEYRING_NS = '__ai__'

export interface AIDeps {
  keyring: KeyringAccess
  schemaAccess: SchemaAccess
  connectionAccess: ConnectionAccess
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
  ipc: PluginIpc
  broadcast: BroadcastFn
}

export interface AIService {
  registerTool: AIToolRegistry['register']
  registerProvider: AIProviderRegistry['register']
  registerContextProvider: ConversationManager['registerContextProvider']
}

export interface AIModule {
  providerRegistry: AIProviderRegistry
  toolRegistry: AIToolRegistry
  permissionManager: PermissionManager
  conversationManager: ConversationManager
  enhancements: ReturnType<typeof createAIEnhancements>
  service: AIService
  /** Dispose to tear down providers + IPC handlers + streams. */
  dispose: Disposable
}

export function startAIModule(deps: AIDeps): AIModule {
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

  const savedProvider = deps.settingsStore.get('ai.activeProvider') as string | undefined
  const savedModel = deps.settingsStore.get('ai.activeModel') as string | undefined
  if (savedProvider && providerRegistry.get(savedProvider)) {
    providerRegistry.setActive(savedProvider)
  } else {
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
      return summary.tables.map((t: typeof summary.tables[number]) => {
        const cols = t.columns.map((c: typeof t.columns[number]) => {
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

  // ── IPC handlers via PluginContext.ipc ──────────────────────────────────────
  const activeStreams = new Map<string, AbortController>()
  const ipcDisposables: Disposable[] = []
  const h = <A extends unknown[], R>(
    channel: Parameters<PluginIpc['handle']>[0],
    fn: (...args: A) => R | Promise<R>
  ) => { ipcDisposables.push(deps.ipc.handle(channel, fn as never)) }

  h('ai:chat:start', async (request: { message: string; connectionMeta?: { type: string; driverName: string } }) => {
    const streamId = randomUUID()
    const controller = new AbortController()
    activeStreams.set(streamId, controller)

    conversationManager.addUserMessage(request.message)

    ;(async () => {
      try {
        for await (const event of conversationManager.chat(request.connectionMeta)) {
          deps.broadcast('ai:chat:event', streamId, event)
        }
      } catch (err) {
        deps.broadcast('ai:chat:event', streamId, {
          type: 'error',
          error: err instanceof Error ? err.message : String(err)
        } satisfies AIStreamEvent)
      } finally {
        activeStreams.delete(streamId)
      }
    })()

    return { streamId }
  })

  h('ai:chat:abort', async (streamId: string) => {
    const controller = activeStreams.get(streamId)
    if (controller) {
      controller.abort()
      activeStreams.delete(streamId)
    }
    conversationManager.abort()
  })

  h('ai:chat:approval-response', async (requestId: string, approved: boolean) => {
    permissionManager.resolveApproval(requestId, approved)
  })

  h('ai:providers:list', async () => providerRegistry.list().map(p => ({ id: p.id, name: p.name })))

  h('ai:providers:list-configured', async () => {
    const configured: { id: string; name: string }[] = []
    if (deps.keyring.has(AI_KEYRING_NS, 'anthropic')) configured.push({ id: 'anthropic', name: 'Anthropic' })
    if (deps.keyring.has(AI_KEYRING_NS, 'openai')) configured.push({ id: 'openai', name: 'OpenAI' })
    const ollamaEndpoint = (deps.settingsStore.get('ai.ollamaEndpoint') as string) || 'http://localhost:11434'
    try {
      const resp = await fetch(`${ollamaEndpoint}/api/tags`, { signal: AbortSignal.timeout(2000) })
      if (resp.ok) configured.push({ id: 'ollama', name: 'Ollama' })
    } catch { /* unreachable */ }
    return configured
  })

  h('ai:providers:set-active', async (providerId: string) => {
    providerRegistry.setActive(providerId)
    deps.settingsStore.set('ai.activeProvider', providerId)
  })

  h('ai:providers:get-active', async () => {
    const active = providerRegistry.getActive()
    return active ? { id: active.id, name: active.name } : null
  })

  h('ai:models:list', async () => {
    const active = providerRegistry.getActive()
    if (!active) return []
    return active.models()
  })

  h('ai:models:set-active', async (modelId: string) => {
    providerRegistry.setActiveModel(modelId)
    deps.settingsStore.set('ai.activeModel', modelId)
  })

  h('ai:models:get-active', async () => providerRegistry.getActiveModel())
  h('ai:messages:list', async () => conversationManager.getMessages())
  h('ai:messages:clear', async () => { conversationManager.clearMessages() })

  h('ai:keys:has', async (provider: 'openai' | 'anthropic') => deps.keyring.has(AI_KEYRING_NS, provider))
  h('ai:keys:set', async (provider: 'openai' | 'anthropic', value: string) => {
    deps.keyring.storeSync(AI_KEYRING_NS, provider, value)
  })

  h('ai:tools:list', async () => toolRegistry.list().map(t => ({
    id: t.id, name: t.name, description: t.description, permission: t.permission
  })))

  h('ai:generate-sql', async (request: Parameters<typeof enhancements.generateSql>[0]) =>
    enhancements.generateSql(request)
  )
  h('ai:complete-sql', async (request: Parameters<typeof enhancements.completeSql>[0]) =>
    enhancements.completeSql(request)
  )
  h('ai:explain-results', async (request: Parameters<typeof enhancements.explainResults>[0]) =>
    enhancements.explainResults(request)
  )

  const service: AIService = {
    registerTool: (tool) => toolRegistry.register(tool),
    registerProvider: (provider) => providerRegistry.register(provider),
    registerContextProvider: (provider) => conversationManager.registerContextProvider(provider)
  }

  const dispose: Disposable = {
    dispose: () => {
      for (const ctrl of activeStreams.values()) {
        try { ctrl.abort() } catch { /* ignore */ }
      }
      activeStreams.clear()
      for (const d of ipcDisposables) {
        try { d.dispose() } catch { /* ignore */ }
      }
    }
  }

  return {
    providerRegistry, toolRegistry, permissionManager, conversationManager,
    enhancements, service, dispose
  }
}
