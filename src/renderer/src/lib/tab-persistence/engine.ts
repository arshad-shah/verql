import type { OpenTabsSnapshot, TabOp } from '@shared/appdata'
import { diffTabs } from './diff'

/** Where the engine reads tabs from and writes ops to. Both are injected so the
 *  engine can be driven by the real Zustand store + IPC in the app, and by plain
 *  fakes in tests. */
export interface TabPersistenceTransport {
  /** Persist a batch of incremental mutations. Resolves when durable. */
  apply: (ops: TabOp[]) => Promise<void>
}

export interface TabPersistenceEngineDeps {
  /** Subscribe to tab-state changes; returns an unsubscribe. */
  subscribe: (run: () => void) => () => void
  /** Read the current persistable snapshot (pure projection of the store). */
  getSnapshot: () => OpenTabsSnapshot
  /** Durable sink for op batches. */
  transport: TabPersistenceTransport
  /** Debounce window for coalescing rapid edits. Defaults to 400ms. */
  debounceMs?: number
  /** Diagnostic channel — a failed write never throws into the caller. */
  onError?: (err: unknown) => void
  /** Timer seam for deterministic tests. Defaults to global setTimeout. */
  timers?: {
    set: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>
    clear: (handle: ReturnType<typeof setTimeout>) => void
  }
}

const EMPTY: OpenTabsSnapshot = { tabs: [], activeId: null }

/**
 * The tab-persistence engine. Owns *all* of restore-on-startup's write side: it
 * watches the live tabs, debounces bursts, diffs against the last-persisted
 * snapshot, and pushes the minimal `TabOp` batch through the transport.
 *
 * Design guarantees:
 * - **Incremental.** Diffing against a held baseline means a single-tab edit
 *   persists a single row, regardless of tab count — the original "too many
 *   tabs" worry.
 * - **Coalesced + serialized.** Rapid changes collapse into one debounced write;
 *   writes never overlap (a change arriving mid-flush re-runs afterwards), so
 *   the baseline can't desync from the store.
 * - **Crash-tolerant baseline.** The baseline only advances *after* a write
 *   succeeds, so a failed write is retried (the same diff re-emerges next tick)
 *   rather than silently lost.
 */
export class TabPersistenceEngine {
  private readonly subscribe: TabPersistenceEngineDeps['subscribe']
  private readonly getSnapshot: TabPersistenceEngineDeps['getSnapshot']
  private readonly transport: TabPersistenceTransport
  private readonly debounceMs: number
  private readonly onError: (err: unknown) => void
  private readonly timers: NonNullable<TabPersistenceEngineDeps['timers']>

  private baseline: OpenTabsSnapshot = EMPTY
  private timer: ReturnType<typeof setTimeout> | null = null
  private running: Promise<void> | null = null
  private dirty = false

  constructor(deps: TabPersistenceEngineDeps) {
    this.subscribe = deps.subscribe
    this.getSnapshot = deps.getSnapshot
    this.transport = deps.transport
    this.debounceMs = deps.debounceMs ?? 400
    this.onError = deps.onError ?? (() => {})
    this.timers = deps.timers ?? {
      set: (cb, ms) => setTimeout(cb, ms),
      clear: (h) => clearTimeout(h),
    }
  }

  /** Seed the last-persisted snapshot — call after hydrating from storage so the
   *  first diff reflects only what the user changes, not the whole restored set. */
  setBaseline(snapshot: OpenTabsSnapshot): void {
    this.baseline = snapshot
  }

  /** Begin watching the store. Returns a stop function that cancels any pending
   *  debounce and unsubscribes (it does not force a final flush — call
   *  `flush()` first if you need the latest state durable). */
  start(): () => void {
    const unsubscribe = this.subscribe(() => this.schedule())
    return () => {
      if (this.timer !== null) {
        this.timers.clear(this.timer)
        this.timer = null
      }
      unsubscribe()
    }
  }

  /** Cancel the debounce and persist any outstanding diff immediately. Awaits
   *  the in-flight write too, so callers (shutdown, tests) observe a settled
   *  store. */
  async flush(): Promise<void> {
    if (this.timer !== null) {
      this.timers.clear(this.timer)
      this.timer = null
    }
    await this.persist()
  }

  private schedule(): void {
    if (this.timer !== null) this.timers.clear(this.timer)
    this.timer = this.timers.set(() => {
      this.timer = null
      void this.persist()
    }, this.debounceMs)
  }

  /** Serialize writes: if one is in flight, mark dirty so it re-runs once it
   *  settles instead of racing a second write against the same baseline. */
  private persist(): Promise<void> {
    if (this.running) {
      this.dirty = true
      return this.running
    }
    this.running = this.drain().finally(() => {
      this.running = null
    })
    return this.running
  }

  private async drain(): Promise<void> {
    do {
      this.dirty = false
      const next = this.getSnapshot()
      const ops = diffTabs(this.baseline, next)
      if (ops.length === 0) continue
      try {
        await this.transport.apply(ops)
        // Advance the baseline only on success so a failed write is retried.
        this.baseline = next
      } catch (err) {
        this.onError(err)
        // Baseline stays put, so the same diff re-emerges on the next change and
        // retries — without spinning here on a hard, persistent failure.
      }
    } while (this.dirty)
  }
}
