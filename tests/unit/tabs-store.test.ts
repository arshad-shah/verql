import { describe, it, expect } from 'vitest'
import type { QueryTab, Tab, QueryResult } from '../../shared/types'

function createQueryTab(id: string, connectionId: string | null = null, schema: string | null = null): QueryTab {
  return {
    id,
    type: 'query',
    title: `Query ${id}`,
    connectionId,
    schema,
    sql: '',
    results: null,
    isExecuting: false,
    error: null
  }
}

describe('Tab logic', () => {
  it('creates a query tab with defaults', () => {
    const tab = createQueryTab('1', 'conn-1')
    expect(tab.type).toBe('query')
    expect(tab.sql).toBe('')
    expect(tab.results).toBeNull()
    expect(tab.isExecuting).toBe(false)
    expect(tab.connectionId).toBe('conn-1')
  })

  it('can update tab SQL', () => {
    const tab = createQueryTab('1')
    const updated = { ...tab, sql: 'SELECT * FROM users' }
    expect(updated.sql).toBe('SELECT * FROM users')
  })

  it('can set execution state', () => {
    const tab = createQueryTab('1')
    const executing = { ...tab, isExecuting: true, error: null, results: null }
    expect(executing.isExecuting).toBe(true)
  })

  it('can set results', () => {
    const result: QueryResult = {
      rows: [{ id: 1 }],
      fields: [{ name: 'id', dataType: 'int', nullable: false }],
      rowCount: 1,
      duration: 10,
      affectedRows: 0
    }
    const tab = createQueryTab('1')
    const withResults = { ...tab, results: result, isExecuting: false }
    expect(withResults.results!.rowCount).toBe(1)
    expect(withResults.isExecuting).toBe(false)
  })

  it('can set error state', () => {
    const tab = createQueryTab('1')
    const withError = { ...tab, error: 'relation "foo" does not exist', isExecuting: false }
    expect(withError.error).toContain('does not exist')
  })

  it('manages multiple tabs', () => {
    const tabs: Tab[] = [
      createQueryTab('1', 'conn-1'),
      createQueryTab('2', 'conn-1'),
    ]
    expect(tabs).toHaveLength(2)
    const removed = tabs.filter(t => t.id !== '1')
    expect(removed).toHaveLength(1)
    expect(removed[0].id).toBe('2')
  })
})
