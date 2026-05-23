// Regression test: when a connection is deleted, every tab that points at it
// must have its connection reference cleared.
//
// Before the fix, query tabs and ER-diagram tabs kept the dead connectionId
// after the user removed the profile. The next execute showed a confusing
// "Not connected" toast, and ER tabs hung trying to fetch tables against a
// connection that no longer existed.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const invokeMock = vi.fn().mockResolvedValue(undefined)
;(globalThis as unknown as { window: { electronAPI: { invoke: typeof invokeMock } } }).window = {
  electronAPI: { invoke: invokeMock }
}

import { useConnectionsStore } from '../../../src/renderer/src/stores/connections'
import { useTabsStore } from '../../../src/renderer/src/stores/tabs'

beforeEach(() => {
  invokeMock.mockClear()
  // CONNECTIONS_LIST is called after deleteConnection — return an empty list.
  invokeMock.mockImplementation((channel: string) => {
    if (channel === 'connections:list') return Promise.resolve([])
    return Promise.resolve(undefined)
  })
  useConnectionsStore.setState({
    connections: [{ id: 'p1', name: 'Doomed', type: 'postgresql', database: 'db' }],
    activeConnectionId: 'p1',
    connectedIds: new Set(['p1']),
    loading: false,
  })
  useTabsStore.setState({ tabs: [], activeTabId: null, recentlyClosed: [] })
})

describe('connections store — deleteConnection cleans up tabs', () => {
  it('detaches query tabs that pointed at the deleted connection', async () => {
    const id = useTabsStore.getState().addQueryTab('p1', 'public')
    useTabsStore.getState().addQueryTab('p2', 'public')

    await useConnectionsStore.getState().deleteConnection('p1')

    const tab = useTabsStore.getState().tabs.find(t => t.id === id)
    if (tab && tab.type === 'query') {
      expect(tab.connectionId).toBeNull()
    } else {
      throw new Error('expected the query tab to still exist after delete')
    }
  })

  it('closes ER-diagram tabs that pointed at the deleted connection', async () => {
    const erId = useTabsStore.getState().openErDiagram('p1', 'public')
    expect(useTabsStore.getState().tabs.find(t => t.id === erId)).toBeDefined()

    await useConnectionsStore.getState().deleteConnection('p1')

    expect(useTabsStore.getState().tabs.find(t => t.id === erId)).toBeUndefined()
  })
})
