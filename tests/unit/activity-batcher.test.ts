import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ActivityBatcher } from '../../src/main/activity/batcher'
import type { ActivityEntry } from '../../shared/activity'

let n = 0
function entry(title: string): ActivityEntry {
  return { id: `e${n++}`, ts: Date.now(), kind: 'log', level: 'info', title }
}

describe('ActivityBatcher', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces a trickle into one flush after the interval', () => {
    const flush = vi.fn()
    const b = new ActivityBatcher(flush, { intervalMs: 100, maxBatch: 50 })

    b.push(entry('a'))
    b.push(entry('b'))
    expect(flush).not.toHaveBeenCalled() // still buffering

    vi.advanceTimersByTime(100)
    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush.mock.calls[0][0].map((e: ActivityEntry) => e.title)).toEqual(['a', 'b'])
  })

  it('flushes immediately once the batch is full', () => {
    const flush = vi.fn()
    const b = new ActivityBatcher(flush, { intervalMs: 1000, maxBatch: 3 })

    b.push(entry('a'))
    b.push(entry('b'))
    b.push(entry('c'))
    expect(flush).toHaveBeenCalledTimes(1) // hit maxBatch, no need to wait
    expect(flush.mock.calls[0][0]).toHaveLength(3)

    // The timer was cleared, so a lone follow-up still waits for the interval.
    b.push(entry('d'))
    expect(flush).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(flush).toHaveBeenCalledTimes(2)
  })

  it('does not flush an empty buffer', () => {
    const flush = vi.fn()
    const b = new ActivityBatcher(flush, { intervalMs: 100 })
    b.flushNow()
    vi.advanceTimersByTime(500)
    expect(flush).not.toHaveBeenCalled()
  })

  it('dispose flushes any pending entries', () => {
    const flush = vi.fn()
    const b = new ActivityBatcher(flush, { intervalMs: 100 })
    b.push(entry('a'))
    b.dispose()
    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush.mock.calls[0][0].map((e: ActivityEntry) => e.title)).toEqual(['a'])
  })
})
