import type { QueryTab } from '@shared/types'
import { useTabsStore, type QueryTabSnapshot } from './tabs'

// Open query tabs are persisted to localStorage so they can be restored on the
// next launch (gated by Settings → General → "Restore tabs on startup"). Only
// query tabs are persisted: they carry the user's un-saved SQL, which is the
// thing worth not losing. Connection-form / settings / plugin / table /
// ER-diagram tabs are transient or depend on a live connection, so they're
// dropped. The snapshot is small and renderer-local, hence localStorage rather
// than the app-data store.
const KEY = 'verql:open-tabs'

interface PersistedTabs {
  tabs: QueryTabSnapshot[]
  /** Index into `tabs` of the tab that was focused, or null. */
  activeIndex: number | null
}

function snapshot(): PersistedTabs {
  const { tabs, activeTabId } = useTabsStore.getState()
  const queryTabs = tabs.filter((t): t is QueryTab => t.type === 'query')
  const snaps: QueryTabSnapshot[] = queryTabs.map((t) => ({
    title: t.title,
    sql: t.sql,
    connectionId: t.connectionId,
    database: t.database,
    schema: t.schema,
    ...(t.savedQueryId ? { savedQueryId: t.savedQueryId } : {}),
    autoCommit: t.txn?.autoCommit ?? true,
  }))
  const idx = queryTabs.findIndex((t) => t.id === activeTabId)
  return { tabs: snaps, activeIndex: idx >= 0 ? idx : null }
}

let timer: ReturnType<typeof setTimeout> | null = null

function persistNow(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()))
  } catch {
    /* quota / serialization failure is non-fatal — restore is best-effort */
  }
}

/**
 * Subscribe to tab changes and persist a debounced snapshot. Always runs so the
 * snapshot is fresh if the user enables restore later. Returns an unsubscribe.
 */
export function initTabPersistence(): () => void {
  const unsub = useTabsStore.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(persistNow, 400)
  })
  return () => {
    if (timer) clearTimeout(timer)
    unsub()
  }
}

/** Re-open the persisted query tabs. No-op when there's no saved snapshot. */
export function restoreOpenTabs(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedTabs
    if (!parsed?.tabs?.length) return
    useTabsStore.getState().restoreQueryTabs(parsed.tabs, parsed.activeIndex)
  } catch {
    /* corrupt snapshot — ignore and start fresh */
  }
}
