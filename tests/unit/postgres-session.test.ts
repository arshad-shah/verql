import { describe, it, expect, vi, beforeEach } from 'vitest'

const clientQueries: string[] = []
const fakeClient = { query: vi.fn(async (sql: string) => { clientQueries.push(sql); return { rows: [], fields: [], rowCount: 0 } }), release: vi.fn() }
const fakePool = { connect: vi.fn(async () => fakeClient), query: vi.fn(async () => ({ rows: [], fields: [], rowCount: 0 })), end: vi.fn() }

vi.mock('pg', () => ({ default: { Pool: class { connect = fakePool.connect; query = fakePool.query; end = fakePool.end } } }))

import { PostgresAdapter } from '../../src/main/plugins/bundled/postgresql/postgres-adapter'

beforeEach(() => { clientQueries.length = 0; fakeClient.query.mockClear(); fakeClient.release.mockClear() })

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
})
