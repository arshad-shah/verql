import type { OpenTabsSnapshot, PersistedTab } from '@shared/appdata'

/** The pre-SQLite localStorage payload written by the old tab-persistence
 *  module: query-tab snapshots without ids, plus an index into them. */
const LEGACY_KEY = 'verql:open-tabs'

interface LegacyTab {
  title: string
  sql: string
  connectionId: string | null
  database: string | null
  schema: string | null
  savedQueryId?: string
  autoCommit: boolean
}
interface LegacyPayload {
  tabs: LegacyTab[]
  activeIndex: number | null
}

/** Mint a stable id for a migrated tab (the legacy format stored none). */
function migratedId(index: number): string {
  return `query-migrated-${index}-${Date.now()}`
}

/**
 * Read and convert the legacy localStorage tab snapshot into the new shape,
 * assigning stable ids. Returns `null` when there's nothing to migrate. Always
 * clears the legacy key afterwards so the migration runs at most once. Best
 * effort: a corrupt or unreadable payload is dropped, not surfaced.
 */
export function readAndClearLegacyTabs(): OpenTabsSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  let raw: string | null
  try {
    raw = localStorage.getItem(LEGACY_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  // Clear up front: even a malformed payload should never be retried.
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore — removal is best effort */
  }
  try {
    const parsed = JSON.parse(raw) as LegacyPayload
    if (!parsed?.tabs?.length) return null
    const tabs: PersistedTab[] = parsed.tabs.map((t, i) => ({
      id: migratedId(i),
      title: t.title,
      sql: t.sql,
      connectionId: t.connectionId,
      database: t.database,
      schema: t.schema,
      ...(t.savedQueryId ? { savedQueryId: t.savedQueryId } : {}),
      autoCommit: t.autoCommit,
    }))
    const idx = parsed.activeIndex
    const activeId = idx != null && tabs[idx] ? tabs[idx].id : null
    return { tabs, activeId }
  } catch {
    return null
  }
}
