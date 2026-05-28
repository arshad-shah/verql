import { create } from 'zustand'

export interface StatementStatus {
  kind: 'ok' | 'error' | 'running'
  /** Wall-clock duration in milliseconds. `null` while running. */
  durationMs: number | null
  /** Row count for `ok`; null otherwise. */
  rowCount: number | null
  /** `Date.now()` at the moment the status was recorded. */
  ranAt: number
}

interface State {
  /** Keyed by `${tabId}::${stmtHash}`. */
  byKey: Record<string, StatementStatus>
  record(tabId: string, stmtHash: string, status: StatementStatus): void
  get(tabId: string, stmtHash: string): StatementStatus | undefined
  clearTab(tabId: string): void
}

const key = (tabId: string, hash: string) => `${tabId}::${hash}`

export const useStatementStatus = create<State>((set, get) => ({
  byKey: {},
  record(tabId, stmtHash, status) {
    set((s) => ({ byKey: { ...s.byKey, [key(tabId, stmtHash)]: status } }))
  },
  get(tabId, stmtHash) {
    return get().byKey[key(tabId, stmtHash)]
  },
  clearTab(tabId) {
    set((s) => {
      const next: Record<string, StatementStatus> = {}
      for (const k of Object.keys(s.byKey)) {
        if (!k.startsWith(`${tabId}::`)) next[k] = s.byKey[k]
      }
      return { byKey: next }
    })
  },
}))

/**
 * Stable 32-bit FNV-1a hash of a SQL statement. Trims surrounding whitespace
 * and lowercases so trivial edits (e.g., reformatting) don't invalidate the
 * status. Returns an 8-char hex string.
 */
export function hashStatement(sql: string): string {
  const s = sql.trim().toLowerCase()
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
