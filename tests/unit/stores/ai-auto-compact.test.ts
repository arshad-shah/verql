import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAIStore } from '@/stores/ai'
import type { AIChatMessage } from '@shared/ai-types'

const msg = (role: 'user' | 'assistant' | 'system', content: string): AIChatMessage => ({
  id: crypto.randomUUID(), role, content, timestamp: Date.now(),
})

describe('useAIStore auto-compact lifecycle', () => {
  const invokeMock = vi.fn()
  beforeEach(() => {
    invokeMock.mockReset()
    ;(window as unknown as { electronAPI: { invoke: typeof invokeMock; on: () => () => void } }).electronAPI = {
      invoke: invokeMock,
      on: () => () => {},
    }
    useAIStore.setState({
      conversations: [{
        id: 'c1', title: 'T', messages: [], stats: { totalInputTokens: 0, totalOutputTokens: 0, toolCallCount: 0 },
        createdAt: 0, updatedAt: 0,
      }],
      activeConversationId: 'c1',
      messages: [],
      isStreaming: false,
      isAwaitingResponse: false,
      isCompacting: false,
      lastPreCompactMessages: null,
      autoCompactSuppressed: {},
    })
  })

  it('compactConversation snapshots prior messages then replaces them', async () => {
    const m = [
      msg('user', 'u1'), msg('assistant', 'a1'),
      msg('user', 'u2'), msg('assistant', 'a2'),
      msg('user', 'u3'), msg('assistant', 'a3'),
    ]
    useAIStore.setState({ messages: m })
    invokeMock.mockResolvedValueOnce({ summary: 'condensed' }).mockResolvedValueOnce(undefined)
    await useAIStore.getState().compactConversation()
    const after = useAIStore.getState()
    expect(after.lastPreCompactMessages).toEqual(m)
    expect(after.messages.length).toBe(3) // summary + 2 kept
    expect(after.messages[0].role).toBe('system')
    expect(after.messages[0].content).toContain('condensed')
  })

  it('undoLastCompact restores the pre-compact list', async () => {
    const before = [msg('user', 'u1'), msg('assistant', 'a1'), msg('user', 'u2')]
    useAIStore.setState({
      messages: [msg('system', 'summary'), msg('user', 'u3')],
      lastPreCompactMessages: before,
    })
    invokeMock.mockResolvedValueOnce(undefined)
    await useAIStore.getState().undoLastCompact()
    const after = useAIStore.getState()
    expect(after.messages).toEqual(before)
    expect(after.lastPreCompactMessages).toBeNull()
  })

  it('suppressAutoCompactForActive sets the flag for the active conversation', () => {
    useAIStore.getState().suppressAutoCompactForActive()
    expect(useAIStore.getState().autoCompactSuppressed['c1']).toBe(true)
  })
})
