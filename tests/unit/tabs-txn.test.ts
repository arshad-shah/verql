import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '../../src/renderer/src/stores/tabs'
import type { QueryTab } from '../../shared/types'

function activeQueryTab(): QueryTab {
  const s = useTabsStore.getState()
  return s.tabs.find((t) => t.id === s.activeTabId) as QueryTab
}

describe('tabs store transaction state', () => {
  beforeEach(() => useTabsStore.setState({ tabs: [], activeTabId: null, recentlyClosed: [] }))

  it('new query tab defaults to auto-commit on, status none', () => {
    useTabsStore.getState().addQueryTab('conn1')
    expect(activeQueryTab().txn).toEqual({ autoCommit: true, status: 'none', readOnly: false })
  })

  it('addQueryTab honors an explicit autoCommit:false default', () => {
    useTabsStore.getState().addQueryTab('conn1', null, { autoCommit: false })
    expect(activeQueryTab().txn?.autoCommit).toBe(false)
  })

  it('setTabAutoCommit + setTabTxnStatus update only the target tab', () => {
    const id = useTabsStore.getState().addQueryTab('conn1')
    useTabsStore.getState().setTabAutoCommit(id, false)
    useTabsStore.getState().setTabTxnStatus(id, 'active')
    expect(activeQueryTab().txn).toMatchObject({ autoCommit: false, status: 'active' })
  })
})
