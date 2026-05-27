import { describe, it, expect } from 'vitest'
import { estimateTokens, estimateMessageTokens, trimMessagesToBudget } from '../../src/main/plugins/bundled/ai/internal/token-estimate'
import type { AIChatMessage } from '@shared/ai-types'

function msg(role: AIChatMessage['role'], content: string, extra: Partial<AIChatMessage> = {}): AIChatMessage {
  return { id: Math.random().toString(36).slice(2), role, content, timestamp: 0, ...extra }
}

describe('estimateTokens', () => {
  it('is zero for empty input and ~chars/4 otherwise', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('a'.repeat(40))).toBe(10)
  })

  it('counts tool-call arguments toward a message', () => {
    const plain = estimateMessageTokens(msg('assistant', 'hi'))
    const withTool = estimateMessageTokens(
      msg('assistant', 'hi', { toolCalls: [{ id: 't1', name: 'query', arguments: '{"sql":"SELECT 1"}' }] })
    )
    expect(withTool).toBeGreaterThan(plain)
  })
})

describe('trimMessagesToBudget', () => {
  it('returns everything when it fits', () => {
    const msgs = [msg('user', 'hello'), msg('assistant', 'hi')]
    expect(trimMessagesToBudget(msgs, 10_000)).toEqual(msgs)
  })

  it('keeps the newest message even if it alone exceeds the budget', () => {
    const msgs = [msg('user', 'a'.repeat(4000))]
    const out = trimMessagesToBudget(msgs, 10)
    expect(out).toHaveLength(1)
  })

  it('drops the oldest turns and starts the window on a user message', () => {
    const msgs = [
      msg('user', 'q1 ' + 'x'.repeat(400)),
      msg('assistant', 'a1 ' + 'x'.repeat(400)),
      msg('user', 'q2 ' + 'x'.repeat(400)),
      msg('assistant', 'a2 ' + 'x'.repeat(400))
    ]
    // Budget large enough for the last two turns but not all four.
    const out = trimMessagesToBudget(msgs, 230)
    expect(out.length).toBeLessThan(msgs.length)
    expect(out[0].role).toBe('user')
    expect(out.at(-1)).toBe(msgs.at(-1))
  })

  it('never leads with an orphaned tool result', () => {
    const msgs = [
      msg('user', 'do it'),
      msg('assistant', '', { toolCalls: [{ id: 't1', name: 'query', arguments: '{}' }] }),
      msg('tool', 'rows', { toolCallId: 't1' }),
      msg('assistant', 'done ' + 'x'.repeat(400)),
      msg('user', 'and again ' + 'x'.repeat(400))
    ]
    const out = trimMessagesToBudget(msgs, 150)
    expect(out[0].role).toBe('user')
    expect(out.some((m) => m.role === 'tool' && out.indexOf(m) === 0)).toBe(false)
  })
})
