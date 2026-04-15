import { create } from 'zustand'
import type {
  AIChatMessage,
  AIProviderInfo,
  AIModelInfo,
  AIApprovalRequest,
  AIStreamEvent
} from '@shared/ai-types'

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

  // Actions
  togglePanel: () => void
  openPanel: () => void
  sendMessage: (message: string, connectionId?: string) => Promise<void>
  clearMessages: () => Promise<void>
  abort: () => Promise<void>
  loadProviders: () => Promise<void>
  loadModels: (providerId: string) => Promise<void>
  setActiveProvider: (provider: AIProviderInfo | null) => void
  setActiveModel: (model: string | null) => void
  respondToApproval: (requestId: string, approved: boolean) => Promise<void>
  handleStreamEvent: (event: AIStreamEvent) => void
}

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

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  openPanel: () => set({ panelOpen: true }),

  sendMessage: async (message, connectionId) => {
    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    const result = await window.electronAPI.invoke('ai:chat:start', {
      message,
      ...(connectionId ? { connectionId } : {})
    }) as { streamId: string }

    set({ isStreaming: true, currentStreamId: result.streamId, streamingContent: '' })
  },

  clearMessages: async () => {
    await window.electronAPI.invoke('ai:messages:clear')
    set({ messages: [] })
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

  loadModels: async (providerId) => {
    const models = await window.electronAPI.invoke('ai:models:list', providerId) as AIModelInfo[]
    set({ models })
  },

  setActiveProvider: (provider) => set({ activeProvider: provider }),

  setActiveModel: (model) => set({ activeModel: model }),

  respondToApproval: async (requestId, approved) => {
    await window.electronAPI.invoke('ai:approval:respond', { requestId, approved })
    set({ pendingApproval: null })
  },

  handleStreamEvent: (event) => {
    switch (event.type) {
      case 'chunk':
        set((s) => ({ streamingContent: s.streamingContent + event.content }))
        break

      case 'tool-call': {
        const toolMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Tool call: ${event.toolCall.name}`,
          toolCalls: [event.toolCall],
          timestamp: Date.now()
        }
        set((s) => ({ messages: [...s.messages, toolMsg] }))
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
        const { streamingContent } = get()
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
          currentStreamId: null
        }))
        break
      }

      case 'error': {
        const errorMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${event.error}`,
          timestamp: Date.now()
        }
        set((s) => ({
          messages: [...s.messages, errorMsg],
          isStreaming: false,
          streamingContent: '',
          currentStreamId: null
        }))
        break
      }
    }
  }
}))

// Set up IPC listener for streaming events
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('ai:chat:event', (streamId: unknown, event: unknown) => {
    const state = useAIStore.getState()
    if (streamId === state.currentStreamId) {
      state.handleStreamEvent(event as AIStreamEvent)
    }
  })
}
