import { create } from 'zustand'
import type {
  AIChatMessage,
  AIProviderInfo,
  AIModelInfo,
  AIApprovalRequest,
  AIStreamEvent
} from '@shared/ai-types'
import { extractAIErrorMessage } from '@/lib/ai-errors'
import { useToastStore } from '@/stores/toast'

interface SessionStats {
  totalInputTokens: number
  totalOutputTokens: number
  toolCallCount: number
}

interface AIState {
  messages: AIChatMessage[]
  isStreaming: boolean
  streamingContent: string
  activeProvider: AIProviderInfo | null
  activeModel: string | null
  providers: AIProviderInfo[]
  models: AIModelInfo[]
  panelOpen: boolean
  pendingApproval: AIApprovalRequest | null
  currentStreamId: string | null
  mcpPendingApproval: { requestId: string; sql: string } | null
  sessionStats: SessionStats

  // Actions
  togglePanel: () => void
  openPanel: () => void
  sendMessage: (message: string, connectionId?: string, connectionMeta?: { type: string; driverName: string }) => Promise<void>
  clearMessages: () => Promise<void>
  abort: () => Promise<void>
  loadProviders: () => Promise<void>
  loadConfiguredProviders: () => Promise<void>
  loadModels: () => Promise<void>
  setActiveProvider: (provider: AIProviderInfo | null) => Promise<void>
  setActiveModel: (model: string | null) => Promise<void>
  respondToApproval: (requestId: string, approved: boolean) => Promise<void>
  respondToMCPApproval: (requestId: string, approved: boolean) => Promise<void>
  handleStreamEvent: (event: AIStreamEvent) => void
}

const EMPTY_STATS: SessionStats = { totalInputTokens: 0, totalOutputTokens: 0, toolCallCount: 0 }

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  activeProvider: null,
  activeModel: null,
  providers: [],
  models: [],
  panelOpen: false,
  pendingApproval: null,
  currentStreamId: null,
  mcpPendingApproval: null,
  sessionStats: { ...EMPTY_STATS },

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  openPanel: () => set({ panelOpen: true }),

  sendMessage: async (message, connectionId, connectionMeta) => {
    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    const result = await window.electronAPI.invoke('ai:chat:start', {
      message,
      ...(connectionId ? { connectionId } : {}),
      ...(connectionMeta ? { connectionMeta } : {}),
    }) as { streamId: string }

    set({ isStreaming: true, currentStreamId: result.streamId, streamingContent: '' })
  },

  clearMessages: async () => {
    await window.electronAPI.invoke('ai:messages:clear')
    set({ messages: [], sessionStats: { ...EMPTY_STATS } })
  },

  abort: async () => {
    const { currentStreamId } = get()
    if (currentStreamId) {
      await window.electronAPI.invoke('ai:chat:abort', currentStreamId)
    }
    set({ isStreaming: false, streamingContent: '', currentStreamId: null })
  },

  loadProviders: async () => {
    const providers = await window.electronAPI.invoke('ai:providers:list') as AIProviderInfo[]
    set({ providers })
  },

  loadConfiguredProviders: async () => {
    const providers = await window.electronAPI.invoke('ai:providers:list-configured') as AIProviderInfo[]
    set({ providers })

    // Auto-select if only one configured
    const { activeProvider } = get()
    if (providers.length === 1 && activeProvider?.id !== providers[0].id) {
      await get().setActiveProvider(providers[0])
    } else if (providers.length > 0 && !activeProvider) {
      // Restore active from the list
      const active = await window.electronAPI.invoke('ai:providers:get-active') as AIProviderInfo | null
      if (active && providers.some(p => p.id === active.id)) {
        set({ activeProvider: active })
      } else {
        await get().setActiveProvider(providers[0])
      }
    }
  },

  loadModels: async () => {
    const models = await window.electronAPI.invoke('ai:models:list') as AIModelInfo[]
    set({ models })
  },

  setActiveProvider: async (provider) => {
    if (provider) {
      await window.electronAPI.invoke('ai:providers:set-active', provider.id)
    }
    set({ activeProvider: provider })
    // Reload models for the new provider
    const models = await window.electronAPI.invoke('ai:models:list') as AIModelInfo[]
    set({ models })
  },

  setActiveModel: async (model) => {
    if (model) {
      await window.electronAPI.invoke('ai:models:set-active', model)
    }
    set({ activeModel: model })
  },

  respondToApproval: async (requestId, approved) => {
    await window.electronAPI.invoke('ai:chat:approval-response', requestId, approved)
    set({ pendingApproval: null })
  },

  respondToMCPApproval: async (requestId, approved) => {
    await window.electronAPI.invoke('mcp:approval-response', requestId, approved)
    set({ mcpPendingApproval: null })
  },

  handleStreamEvent: (event) => {
    switch (event.type) {
      case 'chunk':
        set((s) => ({ streamingContent: s.streamingContent + event.content }))
        break

      case 'tool-call': {
        // Flush any accumulated text before the tool call
        const { streamingContent: pending } = get()
        const newMessages: AIChatMessage[] = []
        if (pending) {
          newMessages.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: pending,
            timestamp: Date.now()
          })
        }
        const toolMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Tool call: ${event.toolCall.name}`,
          toolCalls: [event.toolCall],
          timestamp: Date.now()
        }
        newMessages.push(toolMsg)
        set((s) => ({
          messages: [...s.messages, ...newMessages],
          streamingContent: '',
          sessionStats: {
            ...s.sessionStats,
            toolCallCount: s.sessionStats.toolCallCount + 1
          }
        }))
        break
      }

      case 'tool-result': {
        const resultMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'tool',
          content: event.result.display ?? String(event.result.data),
          toolCallId: event.result.toolCallId,
          timestamp: Date.now()
        }
        set((s) => ({ messages: [...s.messages, resultMsg] }))
        break
      }

      case 'approval-request':
        set({ pendingApproval: event.request })
        break

      case 'done': {
        const { streamingContent, sessionStats } = get()
        const updatedStats = { ...sessionStats }
        if (event.usage) {
          updatedStats.totalInputTokens += event.usage.inputTokens
          updatedStats.totalOutputTokens += event.usage.outputTokens
        }

        if (streamingContent) {
          const assistantMsg: AIChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now()
          }
          set((s) => ({
            messages: [...s.messages, assistantMsg],
            isStreaming: false,
            streamingContent: '',
            currentStreamId: null,
            sessionStats: updatedStats
          }))
        } else {
          set({ isStreaming: false, streamingContent: '', currentStreamId: null, sessionStats: updatedStats })
        }
        break
      }

      case 'error': {
        const friendly = extractAIErrorMessage(event.error)
        const errorMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠ ${friendly}`,
          timestamp: Date.now()
        }
        set((s) => ({
          messages: [...s.messages, errorMsg],
          isStreaming: false,
          streamingContent: '',
          currentStreamId: null
        }))
        useToastStore.getState().addToast({ type: 'error', title: 'AI chat error', message: friendly })
        break
      }
    }
  }
}))

// Set up IPC listeners
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('ai:chat:event', (streamId: unknown, event: unknown) => {
    const state = useAIStore.getState()
    if (streamId === state.currentStreamId) {
      state.handleStreamEvent(event as AIStreamEvent)
    }
  })

  // MCP approval requests
  window.electronAPI.on('mcp:approval-request', (request: unknown) => {
    const req = request as { requestId: string; sql: string }
    useAIStore.setState({ mcpPendingApproval: req })
  })
}
