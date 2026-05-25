import { describe, it, expect, vi, beforeEach } from 'vitest'

const clientQueries: string[] = []
const fakeClient = { query: vi.fn(async (sql: string) => { clientQueries.push(sql); return { rows: [], fields: [], rowCount: 0 } }), release: vi.fn() }
const fakePool = { connect: vi.fn(async () => fakeClient), query: vi.fn(async () => ({ rows: [], fields: [], rowCount: 0 })), end: vi.fn() }

vi.mock('pg', () => ({ default: { Pool: class { connect = fakePool.connect; query = fakePool.query; end = fakePool.end } } }))

import { PostgresAdapter } from '../../src/main/plugins/bundled/postgresql/postgres-adapter'

beforeEach(() => { clientQueries.length = 0; fakeClient.query.mockClear(); fakeClient.release.mockClear(); fakePool.connect.mockClear() })

async function connected(): Promise<PostgresAdapter> {
  const a = new PostgresAdapter({ host: 'h', port: 5432, database: 'd' })
  await a.connect()
  return a
}

describe('PostgresAdapter sessions', () => {
  it('opening an auto-commit-off session pins a client and BEGINs lazily on first query', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    expect(clientQueries).toEqual(['BEGIN', 'INSERT INTO t VALUES (1)'])
  })

  it('beginTransaction injects only allowlisted isolation levels', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.beginTransaction('s1', { isolationLevel: 'SERIALIZABLE', readOnly: true })
    expect(clientQueries).toContain('BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY')
  })

  it('beginTransaction rejects an unknown isolation level', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await expect(a.beginTransaction('s1', { isolationLevel: 'DROP TABLE' })).rejects.toThrow(/isolation/i)
  })

  it('commit issues COMMIT and closeSession releases the client', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    await a.commit('s1')
    await a.closeSession('s1')
    expect(clientQueries).toContain('COMMIT')
    expect(fakeClient.release).toHaveBeenCalled()
  })

  it('an auto-commit (default) session does not inject BEGIN', async () => {
    const a = await connected()
    await a.openSession('s1') // autoCommit defaults true
    await a.query('SELECT 1', undefined, { sessionId: 's1' })
    expect(clientQueries).toEqual(['SELECT 1'])
  })

  it('rollback issues ROLLBACK and clears the transaction', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    await a.rollback('s1')
    expect(clientQueries).toContain('ROLLBACK')
  })

  it('query with an unknown sessionId throws instead of using the pool', async () => {
    const a = await connected()
    await expect(a.query('SELECT 1', undefined, { sessionId: 'nope' })).rejects.toThrow(/no open session/i)
  })

  it('disconnect rolls back and releases pinned session clients', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    await a.disconnect()
    expect(clientQueries).toContain('ROLLBACK')
    expect(fakeClient.release).toHaveBeenCalled()
  })
})
