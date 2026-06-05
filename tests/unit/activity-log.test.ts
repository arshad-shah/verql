import { describe, it, expect, vi } from 'vitest'
import { ActivityLog } from '../../src/main/activity/log'

describe('ActivityLog', () => {
  it('records entries and lists them newest-first', () => {
    const log = new ActivityLog()
    log.record({ kind: 'connection', title: 'first' })
    log.record({ kind: 'query', title: 'second' })
    const list = log.list()
    expect(list.map(e => e.title)).toEqual(['second', 'first'])
    expect(list[0].id).toBeTruthy()
    expect(list[0].level).toBe('info') // default
    expect(typeof list[0].ts).toBe('number')
  })

  it('filters by kind and limit', () => {
    const log = new ActivityLog()
    log.record({ kind: 'query', title: 'q1' })
    log.record({ kind: 'connection', title: 'c1' })
    log.record({ kind: 'query', title: 'q2' })

    expect(log.list({ kinds: ['query'] }).map(e => e.title)).toEqual(['q2', 'q1'])
    expect(log.list({ limit: 1 }).map(e => e.title)).toEqual(['q2'])
    expect(log.list({ kinds: ['notification'] })).toEqual([])
  })

  it('filters by sinceTs', () => {
    const log = new ActivityLog()
    vi.spyOn(Date, 'now').mockReturnValue(100)
    log.record({ kind: 'query', title: 'old' })
    vi.spyOn(Date, 'now').mockReturnValue(200)
    log.record({ kind: 'query', title: 'new' })
    vi.restoreAllMocks()

    expect(log.list({ sinceTs: 150 }).map(e => e.title)).toEqual(['new'])
  })

  it('drops the oldest entries past the cap', () => {
    const log = new ActivityLog(3)
    for (let i = 0; i < 5; i++) log.record({ kind: 'query', title: `q${i}` })
    expect(log.list().map(e => e.title)).toEqual(['q4', 'q3', 'q2'])
  })

  it('notifies subscribers on record and stops after unsubscribe', () => {
    const log = new ActivityLog()
    const seen: string[] = []
    const unsub = log.subscribe(e => seen.push(e.title))
    log.record({ kind: 'query', title: 'a' })
    unsub()
    log.record({ kind: 'query', title: 'b' })
    expect(seen).toEqual(['a'])
  })

  it('clips over-long text fields', () => {
    const log = new ActivityLog()
    const huge = 'x'.repeat(5000)
    const entry = log.record({ kind: 'query', title: huge, detail: huge })
    expect(entry.title.length).toBeLessThanOrEqual(2000)
    expect(entry.detail!.endsWith('…')).toBe(true)
  })

  it('a throwing subscriber does not break recording', () => {
    const log = new ActivityLog()
    log.subscribe(() => { throw new Error('boom') })
    expect(() => log.record({ kind: 'query', title: 'ok' })).not.toThrow()
    expect(log.list()).toHaveLength(1)
  })

  it('clear() empties the log', () => {
    const log = new ActivityLog()
    log.record({ kind: 'query', title: 'a' })
    log.clear()
    expect(log.list()).toEqual([])
  })
})
