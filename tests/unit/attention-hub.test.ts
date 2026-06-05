import { describe, it, expect, vi } from 'vitest'
import { AttentionHubImpl, type AttentionEvent } from '../../src/main/attention/attention-hub'

describe('AttentionHubImpl', () => {
  it('relays request and resolve events to subscribers', () => {
    const hub = new AttentionHubImpl()
    const events: AttentionEvent[] = []
    hub.subscribe((e) => events.push(e))

    hub.request({ id: 'r1', kind: 'approval', title: 'Approve?' })
    hub.resolve('r1')

    expect(events).toEqual([
      { type: 'requested', request: { id: 'r1', kind: 'approval', title: 'Approve?' } },
      { type: 'resolved', id: 'r1' },
    ])
  })

  it('ignores a resolve for an unknown or already-resolved id', () => {
    const hub = new AttentionHubImpl()
    const listener = vi.fn()
    hub.subscribe(listener)

    hub.resolve('never-requested')
    hub.request({ id: 'r1', kind: 'alert', title: 'x' })
    hub.resolve('r1')
    hub.resolve('r1') // second resolve is a no-op

    const resolveEvents = listener.mock.calls.filter(([e]) => e.type === 'resolved')
    expect(resolveEvents).toHaveLength(1)
  })

  it('stops delivering after a subscription is disposed', () => {
    const hub = new AttentionHubImpl()
    const listener = vi.fn()
    const sub = hub.subscribe(listener)
    sub.dispose()
    hub.request({ id: 'r1', kind: 'info', title: 'x' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('isolates a throwing subscriber from the others', () => {
    const hub = new AttentionHubImpl()
    const good = vi.fn()
    hub.subscribe(() => { throw new Error('boom') })
    hub.subscribe(good)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => hub.request({ id: 'r1', kind: 'info', title: 'x' })).not.toThrow()
    expect(good).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})
