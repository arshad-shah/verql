import type { Tab, QueryTab } from '@shared/types'
import type { OpenTabsSnapshot, PersistedTab } from '@shared/appdata'

/** The slice of the tabs store the engine reads. Kept structural so the pure
 *  selector is trivially testable without the real Zustand store. */
export interface TabsSlice {
  tabs: Tab[]
  activeTabId: string | null
}

const isQueryTab = (tab: Tab): tab is QueryTab => tab.type === 'query'

/** Project one query tab into its durable, serialisable shape. Transient
 *  runtime state (results, execution, txn status) is intentionally dropped. */
function toPersistedTab(tab: QueryTab): PersistedTab {
  return {
    id: tab.id,
    title: tab.title,
    sql: tab.sql,
    connectionId: tab.connectionId,
    database: tab.database,
    schema: tab.schema,
    ...(tab.savedQueryId ? { savedQueryId: tab.savedQueryId } : {}),
    autoCommit: tab.txn?.autoCommit ?? true,
  }
}

/**
 * Pure projection of the live tabs state into the persisted snapshot: only
 * query tabs are durable (connection-form / settings / plugin / table /
 * ER-diagram tabs are transient or depend on a live connection). `activeId` is
 * carried only when the focused tab is itself a persisted query tab — focusing a
 * non-persisted tab (Settings, Welcome) records `null`, so restore falls back to
 * the first tab rather than pointing at something that won't come back.
 */
export function selectPersistableTabs(state: TabsSlice): OpenTabsSnapshot {
  const queryTabs = state.tabs.filter(isQueryTab)
  const activeIsPersisted = queryTabs.some((t) => t.id === state.activeTabId)
  return {
    tabs: queryTabs.map(toPersistedTab),
    activeId: activeIsPersisted ? state.activeTabId : null,
  }
}
