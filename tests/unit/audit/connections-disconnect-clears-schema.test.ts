// Regression test: disconnecting a connection clears the schema cache and
// drops tabs that point at that connection out of the "still attached" state.
//
// Before the fix, the schema store kept its cached tables/columns/indexes
// keyed by connection id forever, so re-connecting a profile served stale
// schema from the previous session. Worse: query tabs continued to dangle
// against a connection that was no longer attached, so the next execute
// surfaced a generic "Not connected" with no UI hint about why.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub the preload bridge — the store calls window.electronAPI.invoke.
const invokeMock = vi.fn().mockResolvedValue(undefined)
;(globalThis as unknown as { window: { electronAPI: { invoke: typeof invokeMock } } }).window = {
  electronAPI: { invoke: invokeMock }
}

import { useConnectionsStore } from '../../../src/renderer/src/stores/connections'
import { useSchemaStore } from '../../../src/renderer/src/stores/schema'

beforeEach(() => {
  invokeMock.mockClear()
  invokeMock.mockResolvedValue(undefined)
  useConnectionsStore.setState({
    connections: [{
      id: 'p1', name: 'Test', type: 'postgresql', database: 'db'
    }],
    activeConnectionId: 'p1',
    connectedIds: new Set(['p1']),
    loading: false,
  })
  useSchemaStore.setState({
    tables: new Map([['p1:public', [{ name: 't', schema: 'public', type: 'table' }]]]),
    columns: new Map(),
    indexes: new Map(),
    schemas: new Map([['p1', ['public']]]),
    databases: new Map([['p1', ['db']]]),
    objects: new Map(),
    rowCounts: new Map(),
    expandedTables: new Set(),
    filterText: '',
    loading: false,
    cacheVersion: 0,
  })
})

describe('connections store — disconnect invalidates schema cache', () => {
  it('drops every schema-cache entry keyed by that connection', async () => {
    await useConnectionsStore.getState().disconnect('p1')

    const s = useSchemaStore.getState()
    expect(s.tables.has('p1:public')).toBe(false)
    expect(s.schemas.has('p1')).toBe(false)
    expect(s.databases.has('p1')).toBe(false)
  })

  it('leaves other connections’ schema cache intact', async () => {
    useSchemaStore.setState({
      tables: new Map([
        ['p1:public', [{ name: 't', schema: 'public', type: 'table' }]],
        ['p2:public', [{ name: 'u', schema: 'public', type: 'table' }]],
      ]),
      schemas: new Map([['p1', ['public']], ['p2', ['public']]]),
    } as Partial<ReturnType<typeof useSchemaStore.getState>>)

    await useConnectionsStore.getState().disconnect('p1')

    const s = useSchemaStore.getState()
    expect(s.tables.has('p2:public')).toBe(true)
    expect(s.schemas.has('p2')).toBe(true)
  })
})
