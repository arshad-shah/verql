// tests/unit/ai-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock electronAPI before importing store
const mockInvoke = vi.fn()
const mockOn = vi.fn(() => vi.fn())
vi.stubGlobal('window', {
  electronAPI: {
    invoke: mockInvoke,
    on: mockOn
  }
})

import { useAIStore } from '../../src/renderer/src/stores/ai'

describe('AI Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAIStore.setState({
      messages: [],
      isStreaming: false,
      activeProvider: null,
      activeModel: null,
      panelOpen: false,
      streamingContent: '',
      providers: [],
      models: [],
      pendingApproval: null,
      currentStreamId: null
    })
  })

  it('starts with empty state', () => {
    const state = useAIStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isStreaming).toBe(false)
    expect(state.panelOpen).toBe(false)
  })

  it('toggles panel', () => {
    useAIStore.getState().togglePanel()
    expect(useAIStore.getState().panelOpen).toBe(true)
    useAIStore.getState().togglePanel()
    expect(useAIStore.getState().panelOpen).toBe(false)
  })

  it('sends a message', async () => {
    mockInvoke.mockResolvedValue({ streamId: 'stream-1' })
    await useAIStore.getState().sendMessage('Hello')
    expect(mockInvoke).toHaveBeenCalledWith('ai:chat:start', { message: 'Hello' })
    expect(useAIStore.getState().messages).toHaveLength(1)
    expect(useAIStore.getState().messages[0].role).toBe('user')
    expect(useAIStore.getState().isStreaming).toBe(true)
  })

  it('clears messages', async () => {
    mockInvoke.mockResolvedValue(undefined)
    useAIStore.setState({ messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }] })
    await useAIStore.getState().clearMessages()
    expect(mockInvoke).toHaveBeenCalledWith('ai:messages:clear')
    expect(useAIStore.getState().messages).toEqual([])
  })

  it('loads providers', async () => {
    mockInvoke.mockResolvedValueOnce([{ id: 'openai', name: 'OpenAI' }])
      .mockResolvedValueOnce({ id: 'openai', name: 'OpenAI' })
    await useAIStore.getState().loadProviders()
    expect(useAIStore.getState().providers).toEqual([{ id: 'openai', name: 'OpenAI' }])
  })

  it('handles stream chunk event', () => {
    useAIStore.setState({ isStreaming: true, currentStreamId: 'stream-1' })
    useAIStore.getState().handleStreamEvent({ type: 'chunk', content: 'Hello' })
    expect(useAIStore.getState().streamingContent).toBe('Hello')
    useAIStore.getState().handleStreamEvent({ type: 'chunk', content: ' world' })
    expect(useAIStore.getState().streamingContent).toBe('Hello world')
  })

  it('handles stream done event', () => {
    useAIStore.setState({ isStreaming: true, streamingContent: 'Hello', currentStreamId: 'stream-1' })
    useAIStore.getState().handleStreamEvent({ type: 'done' })
    expect(useAIStore.getState().isStreaming).toBe(false)
    expect(useAIStore.getState().streamingContent).toBe('')
    // Assistant message should be added
    const msgs = useAIStore.getState().messages
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe('assistant')
    expect(msgs[0].content).toBe('Hello')
  })
})
