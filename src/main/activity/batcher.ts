import type { ActivityEntry } from '@shared/activity'

export interface ActivityBatcherOptions {
  /** Max time an entry waits before it is flushed (ms). */
  intervalMs?: number
  /** Flush immediately once this many entries have accumulated. */
  maxBatch?: number
}

/**
 * Coalesces activity entries into batches so a busy stream (a migration, a
 * chatty AI tool loop, verbose debug logging) becomes a handful of IPC
 * round-trips instead of one per entry.
 *
 * Entries are flushed when either the buffer reaches `maxBatch` (so a burst is
 * delivered promptly) or `intervalMs` elapses since the first buffered entry
 * (so a trickle still arrives quickly). Pure and electron-free: the caller
 * supplies `flush`, which makes this trivially unit-testable.
 */
export class ActivityBatcher {
  private buffer: ActivityEntry[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private readonly intervalMs: number
  private readonly maxBatch: number

  constructor(
    private readonly flush: (entries: ActivityEntry[]) => void,
    options: ActivityBatcherOptions = {},
  ) {
    this.intervalMs = options.intervalMs ?? 100
    this.maxBatch = options.maxBatch ?? 50
  }

  /** Buffer one entry, flushing eagerly if the batch is full. */
  push = (entry: ActivityEntry): void => {
    this.buffer.push(entry)
    if (this.buffer.length >= this.maxBatch) {
      this.flushNow()
      return
    }
    if (this.timer === null) {
      this.timer = setTimeout(() => this.flushNow(), this.intervalMs)
    }
  }

  /** Emit whatever is buffered right now (no-op if empty). */
  flushNow = (): void => {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.buffer.length === 0) return
    const batch = this.buffer
    this.buffer = []
    this.flush(batch)
  }

  /** Cancel the pending timer and flush any remaining entries. */
  dispose(): void {
    this.flushNow()
  }
}
