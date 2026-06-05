import { randomUUID } from 'crypto'
import type { ActivityEntry, ActivityKind, ActivityQuery } from '@shared/activity'

/** Read surface handed to consumers (e.g. the activity tool) via the service
 *  registry — list + live subscription, no ability to write. */
export interface ActivityReader {
  list(query?: ActivityQuery): ActivityEntry[]
  subscribe(listener: (entry: ActivityEntry) => void): () => void
}

export interface RecordInput {
  kind: ActivityKind
  level?: ActivityEntry['level']
  title: string
  detail?: string
  source?: string
  durationMs?: number
}

const DEFAULT_CAP = 1000
/** Hard cap on any single stored text field so a giant SQL/error can't bloat
 *  the in-memory ring (and the entries sent to the renderer). */
const MAX_TEXT = 2000

function clip(text: string | undefined): string | undefined {
  if (text === undefined) return undefined
  return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT - 1) + '…' : text
}

/**
 * In-memory ring buffer of app activity. Newest entries are appended; once the
 * cap is reached the oldest are dropped. `list()` returns newest-first.
 */
export class ActivityLog implements ActivityReader {
  private entries: ActivityEntry[] = []
  private listeners = new Set<(entry: ActivityEntry) => void>()

  constructor(private cap: number = DEFAULT_CAP) {}

  record(input: RecordInput): ActivityEntry {
    const entry: ActivityEntry = {
      id: randomUUID(),
      ts: Date.now(),
      kind: input.kind,
      level: input.level ?? 'info',
      title: clip(input.title) ?? '',
      detail: clip(input.detail),
      source: input.source,
      durationMs: input.durationMs,
    }
    this.entries.push(entry)
    if (this.entries.length > this.cap) {
      this.entries.splice(0, this.entries.length - this.cap)
    }
    for (const l of this.listeners) {
      try { l(entry) } catch { /* a bad listener must not break recording */ }
    }
    return entry
  }

  list(query: ActivityQuery = {}): ActivityEntry[] {
    const kinds = query.kinds && query.kinds.length > 0 ? new Set(query.kinds) : null
    let out = this.entries
    if (kinds || query.sinceTs !== undefined) {
      out = out.filter(
        e => (!kinds || kinds.has(e.kind)) && (query.sinceTs === undefined || e.ts >= query.sinceTs),
      )
    }
    // Newest first.
    out = [...out].reverse()
    if (query.limit !== undefined && query.limit >= 0) out = out.slice(0, query.limit)
    return out
  }

  subscribe(listener: (entry: ActivityEntry) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  clear(): void {
    this.entries = []
  }
}
