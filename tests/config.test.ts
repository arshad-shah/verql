import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Conf from 'conf'
import { randomBytes } from 'crypto'

// We test config logic by creating an isolated Conf instance
// rather than importing the module-level singleton

interface TestConfig {
  configVersion: number
  connections: any[]
  queryHistory: any[]
  savedQueries: any[]
  maxHistoryItems: number
}

function createTestStore() {
  return new Conf<TestConfig>({
    projectName: `dbterm-test-${randomBytes(4).toString('hex')}`,
    defaults: {
      configVersion: 2,
      connections: [],
      queryHistory: [],
      savedQueries: [],
      maxHistoryItems: 200,
    },
  })
}

describe('Config store logic', () => {
  let store: Conf<TestConfig>

  beforeEach(() => {
    store = createTestStore()
  })

  afterEach(() => {
    store.clear()
  })

  describe('saveConnection / getConnection / deleteConnection', () => {
    it('round-trips a connection', () => {
      const conn = { id: 'test1', name: 'My DB', type: 'postgresql', database: 'testdb' }
      const connections = store.get('connections')
      connections.push(conn)
      store.set('connections', connections)

      const retrieved = store.get('connections').find((c: any) => c.id === 'test1')
      expect(retrieved).toBeDefined()
      expect(retrieved.name).toBe('My DB')
    })

    it('updates existing connection', () => {
      const conn = { id: 'test2', name: 'Old Name', type: 'sqlite', database: 'test.db' }
      store.set('connections', [conn])

      const connections = store.get('connections')
      const idx = connections.findIndex((c: any) => c.id === 'test2')
      connections[idx] = { ...conn, name: 'New Name' }
      store.set('connections', connections)

      const retrieved = store.get('connections').find((c: any) => c.id === 'test2')
      expect(retrieved.name).toBe('New Name')
    })

    it('deletes a connection', () => {
      store.set('connections', [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ])
      store.set('connections', store.get('connections').filter((c: any) => c.id !== 'a'))
      expect(store.get('connections').length).toBe(1)
      expect(store.get('connections')[0].id).toBe('b')
    })
  })

  describe('addToHistory', () => {
    it('respects maxHistoryItems', () => {
      store.set('maxHistoryItems', 5)
      for (let i = 0; i < 10; i++) {
        const history = store.get('queryHistory')
        history.unshift({ id: `h${i}`, connectionId: 'c1', sql: `SELECT ${i}`, executedAt: new Date().toISOString() })
        store.set('queryHistory', history.slice(0, store.get('maxHistoryItems')))
      }
      expect(store.get('queryHistory').length).toBe(5)
    })
  })

  describe('savedQueries', () => {
    it('filters by dbType correctly', () => {
      store.set('savedQueries', [
        { id: 'q1', name: 'PG Query', sql: 'SELECT 1', connectionType: 'postgresql', createdAt: '', updatedAt: '' },
        { id: 'q2', name: 'MySQL Query', sql: 'SELECT 2', connectionType: 'mysql', createdAt: '', updatedAt: '' },
        { id: 'q3', name: 'Any Query', sql: 'SELECT 3', createdAt: '', updatedAt: '' },
      ])

      const all = store.get('savedQueries')
      const pgQueries = all.filter((q: any) => !q.connectionType || q.connectionType === 'postgresql')
      expect(pgQueries.length).toBe(2) // q1 + q3 (no type = matches any)

      const mysqlQueries = all.filter((q: any) => !q.connectionType || q.connectionType === 'mysql')
      expect(mysqlQueries.length).toBe(2) // q2 + q3
    })
  })
})
