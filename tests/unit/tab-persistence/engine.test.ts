import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TabPersistenceEngine } from '../../../src/renderer/src/lib/tab-persistence/engine'
import type { OpenTabsSnapshot, PersistedTab, TabOp } from '../../../shared/appdata'

function tab(id: string, over: Partial<PersistedTab> = {}): PersistedTab {
  return { id, title: id, sql: '', connectionId: null, database: null, schema: null, autoCommit: true, ...over }
}
function snap(tabs: PersistedTab[], activeId: string | null = null): OpenTabsSnapshot {
  return { tabs, activeId }
}

/** A controllable store double: records applied batches and lets a test make the
 *  *next* write hang (until `release()`) or fail. Modes are one-shot. */
function fakeStore() {
  const batches: TabOp[][] = []
  let mode: 'pass' | 'block' | 'fail' = 'pass'
  let pending: (() => void) | null = null
  return {
    batches,
    blockNext() { mode = 'block' },
    failNext() { mode = 'fail' },
    release() { pending?.(); pending = null },
    transport: {
      apply: async (ops: TabOp[]) => {
        batches.push(ops)
        const m = mode
        mode = 'pass' // one-shot
        if (m === 'fail') throw new Error('write failed')
        if (m === 'block') await new Promise<void>((resolve) => { pending = resolve })
      },
    },
  }
}

/** A minimal observable source the engine subscribes to. */
function fakeSource(initial: OpenTabsSnapshot) {
  let current = initial
  const listeners = new Set<() => void>()
  return {
    set(next: OpenTabsSnapshot) {
      current = next
      for (const l of listeners) l()
    },
    subscribe: (run: () => void) => {
      listeners.add(run)
      return () => listeners.delete(run)
    },
    getSnapshot: () => current,
  }
}

describe('TabPersistenceEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces a burst of edits into one write', async () => {
    const store = fakeStore()
    const src = fakeSource(snap([]))
    const engine = new TabPersistenceEngine({
      subscribe: src.subscribe,
      getSnapshot: src.getSnapshot,
      transport: store.transport,
      debounceMs: 400,
    })
    engine.start()

    src.set(snap([tab('a', { sql: 'S' })]))
    src.set(snap([tab('a', { sql: 'SE' })]))
    src.set(snap([tab('a', { sql: 'SEL' })]))
    expect(store.batches).toHaveLength(0) // still within the debounce window

    await vi.advanceTimersByTimeAsync(400)
    expect(store.batches).toHaveLength(1)
    // Only the final coalesced state is written.
    expect(store.batches[0]).toEqual([{ kind: 'upsert', tab: tab('a', { sql: 'SEL' }), position: 0 }])
  })

  it('writes only the changed tab when one of many is edited', async () => {
    const store = fakeStore()
    const base = snap([tab('a'), tab('b'), tab('c'), tab('d')])
    const src = fakeSource(base)
    const engine = new TabPersistenceEngine({
      subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport,
    })
    engine.setBaseline(base) // already persisted
    engine.start()

    src.set(snap([tab('a'), tab('b'), tab('c', { sql: 'edited' }), tab('d')]))
    await vi.advanceTimersByTimeAsync(400)

    expect(store.batches).toEqual([[{ kind: 'upsert', tab: tab('c', { sql: 'edited' }), position: 2 }]])
  })

  it('skips the write entirely when the diff is empty', async () => {
    const store = fakeStore()
    const base = snap([tab('a')], 'a')
    const src = fakeSource(base)
    const engine = new TabPersistenceEngine({ subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport })
    engine.setBaseline(base)
    engine.start()

    src.set(snap([tab('a')], 'a')) // identical content → no ops
    await vi.advanceTimersByTimeAsync(400)
    expect(store.batches).toHaveLength(0)
  })

  it('serializes overlapping writes and re-runs against the latest state', async () => {
    const store = fakeStore()
    const src = fakeSource(snap([]))
    const engine = new TabPersistenceEngine({ subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport })
    engine.start()

    // First write hangs; a change arrives mid-flight.
    store.blockNext()
    src.set(snap([tab('a', { sql: '1' })]))
    await vi.advanceTimersByTimeAsync(400)
    expect(store.batches).toHaveLength(1)

    src.set(snap([tab('a', { sql: '2' })])) // happens while first apply is in flight
    await vi.advanceTimersByTimeAsync(400)
    expect(store.batches).toHaveLength(1) // not started yet — first still in flight

    store.release()
    await vi.runAllTimersAsync()
    // The queued change is flushed against the latest state afterwards.
    expect(store.batches).toHaveLength(2)
    expect(store.batches[1]).toEqual([{ kind: 'upsert', tab: tab('a', { sql: '2' }), position: 0 }])
  })

  it('does not advance the baseline when a write fails, so it retries', async () => {
    const store = fakeStore()
    const errors: unknown[] = []
    const src = fakeSource(snap([]))
    const engine = new TabPersistenceEngine({
      subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport,
      onError: (e) => errors.push(e),
    })
    engine.start()

    store.failNext()
    src.set(snap([tab('a', { sql: '1' })]))
    await vi.advanceTimersByTimeAsync(400)
    await vi.runAllTimersAsync()
    expect(errors).toHaveLength(1)
    expect(store.batches).toHaveLength(1)

    // A later change re-emits the still-unpersisted tab (baseline never moved).
    src.set(snap([tab('a', { sql: '1' }), tab('b')]))
    await vi.advanceTimersByTimeAsync(400)
    await vi.runAllTimersAsync()
    expect(store.batches[1]).toEqual([
      { kind: 'upsert', tab: tab('a', { sql: '1' }), position: 0 },
      { kind: 'upsert', tab: tab('b'), position: 1 },
    ])
  })

  it('flush() persists the pending diff immediately without waiting for the debounce', async () => {
    const store = fakeStore()
    const src = fakeSource(snap([]))
    const engine = new TabPersistenceEngine({ subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport })
    engine.start()

    src.set(snap([tab('a')]))
    await engine.flush()
    expect(store.batches).toEqual([[{ kind: 'upsert', tab: tab('a'), position: 0 }]])
  })

  it('stop() cancels a pending debounced write', async () => {
    const store = fakeStore()
    const src = fakeSource(snap([]))
    const engine = new TabPersistenceEngine({ subscribe: src.subscribe, getSnapshot: src.getSnapshot, transport: store.transport })
    const stop = engine.start()

    src.set(snap([tab('a')]))
    stop()
    await vi.advanceTimersByTimeAsync(400)
    expect(store.batches).toHaveLength(0)
  })
})
