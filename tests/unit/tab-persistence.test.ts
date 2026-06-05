import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTabsStore } from '../../src/renderer/src/stores/tabs'
import { initTabPersistence, restoreOpenTabs } from '../../src/renderer/src/stores/tab-persistence'

const KEY = 'verql:open-tabs'

function resetTabs() {
  useTabsStore.setState({ tabs: [], activeTabId: null, recentlyClosed: [] })
}

describe('restoreQueryTabs', () => {
  beforeEach(resetTabs)

  it('re-creates clean, idle query tabs from snapshots', () => {
    useTabsStore.getState().restoreQueryTabs(
      [
        { title: 'A', sql: 'SELECT 1', connectionId: 'c1', database: 'db', schema: 's', autoCommit: true },
        { title: 'B', sql: 'SELECT 2', connectionId: null, database: null, schema: null, autoCommit: false, savedQueryId: 'sq1' },
      ],
      1,
    )
    const { tabs, activeTabId } = useTabsStore.getState()
    expect(tabs).toHaveLength(2)
    const [a, b] = tabs
    expect(a.type).toBe('query')
    if (a.type === 'query') {
      expect(a.sql).toBe('SELECT 1')
      expect(a.savedSnapshot).toBe('SELECT 1')
      expect(a.isDirty).toBe(false)
      expect(a.connectionId).toBe('c1')
      expect(a.txn?.autoCommit).toBe(true)
    }
    if (b.type === 'query') {
      expect(b.savedQueryId).toBe('sq1')
      expect(b.txn?.autoCommit).toBe(false)
    }
    // activeIndex 1 selects the second restored tab
    expect(activeTabId).toBe(tabs[1].id)
  })

  it('falls back to the first tab when activeIndex is null', () => {
    useTabsStore.getState().restoreQueryTabs(
      [{ title: 'A', sql: 'x', connectionId: null, database: null, schema: null, autoCommit: true }],
      null,
    )
    const { tabs, activeTabId } = useTabsStore.getState()
    expect(activeTabId).toBe(tabs[0].id)
  })

  it('is a no-op for an empty snapshot list', () => {
    useTabsStore.getState().restoreQueryTabs([], null)
    expect(useTabsStore.getState().tabs).toHaveLength(0)
  })
})

describe('tab persistence round-trip', () => {
  beforeEach(() => {
    resetTabs()
    localStorage.clear()
    vi.useRealTimers()
  })

  it('persists query tabs (only) on change and restores them', () => {
    vi.useFakeTimers()
    const stop = initTabPersistence()

    const id = useTabsStore.getState().addQueryTab('c1', 's1')
    useTabsStore.getState().updateTabSql(id, 'SELECT 42')
    // A non-query tab must be excluded from the snapshot.
    useTabsStore.getState().openSettings()

    vi.advanceTimersByTime(500)
    stop()

    const raw = localStorage.getItem(KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.tabs).toHaveLength(1)
    expect(parsed.tabs[0].sql).toBe('SELECT 42')
    expect(parsed.tabs[0].connectionId).toBe('c1')

    vi.useRealTimers()
    // Restore into a fresh store.
    resetTabs()
    restoreOpenTabs()
    const restored = useTabsStore.getState().tabs
    expect(restored).toHaveLength(1)
    expect(restored[0].type).toBe('query')
    if (restored[0].type === 'query') expect(restored[0].sql).toBe('SELECT 42')
  })

  it('restoreOpenTabs is a no-op without a saved snapshot', () => {
    localStorage.removeItem(KEY)
    restoreOpenTabs()
    expect(useTabsStore.getState().tabs).toHaveLength(0)
  })
})
