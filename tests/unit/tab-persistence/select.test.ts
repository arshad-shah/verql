import { describe, it, expect } from 'vitest'
import { selectPersistableTabs, type TabsSlice } from '../../../src/renderer/src/lib/tab-persistence/select'
import type { Tab, QueryTab, QueryResult } from '../../../shared/types'

function queryTab(id: string, over: Partial<QueryTab> = {}): QueryTab {
  return {
    id,
    type: 'query',
    title: id,
    connectionId: null,
    database: null,
    schema: null,
    sql: '',
    results: null,
    isExecuting: false,
    error: null,
    isDirty: false,
    aiExplanation: null,
    txn: { autoCommit: true, status: 'none', readOnly: false },
    ...over,
  }
}

describe('selectPersistableTabs', () => {
  it('keeps only query tabs, dropping transient/non-query ones', () => {
    const tabs: Tab[] = [
      queryTab('q1', { sql: 'SELECT 1' }),
      { id: 'settings', type: 'settings', title: 'Settings' },
      { id: 'welcome', type: 'welcome', title: 'Welcome' },
      queryTab('q2'),
    ]
    const snap = selectPersistableTabs({ tabs, activeTabId: 'q1' })
    expect(snap.tabs.map((t) => t.id)).toEqual(['q1', 'q2'])
    expect(snap.tabs[0].sql).toBe('SELECT 1')
  })

  it('projects only durable fields and derives autoCommit from txn', () => {
    const tabs: Tab[] = [
      queryTab('q1', {
        title: 'My query',
        sql: 'SELECT 42',
        connectionId: 'c1',
        database: 'db',
        schema: 's',
        savedQueryId: 'sq1',
        txn: { autoCommit: false, status: 'active', readOnly: true },
        // transient state that must NOT leak into the snapshot:
        results: { columns: [], rows: [] } as unknown as QueryResult,
        isExecuting: true,
      }),
    ]
    const snap = selectPersistableTabs({ tabs, activeTabId: 'q1' })
    expect(snap.tabs[0]).toEqual({
      id: 'q1',
      title: 'My query',
      sql: 'SELECT 42',
      connectionId: 'c1',
      database: 'db',
      schema: 's',
      savedQueryId: 'sq1',
      autoCommit: false,
    })
  })

  it('records activeId only when the focused tab is a persisted query tab', () => {
    const tabs: Tab[] = [queryTab('q1'), { id: 'settings', type: 'settings', title: 'Settings' }]
    expect(selectPersistableTabs({ tabs, activeTabId: 'q1' }).activeId).toBe('q1')
    expect(selectPersistableTabs({ tabs, activeTabId: 'settings' }).activeId).toBeNull()
    expect(selectPersistableTabs({ tabs, activeTabId: null } as TabsSlice).activeId).toBeNull()
  })
})
