import { describe, it, expect, beforeEach } from 'vitest'
import { SqliteAdapter } from '../../src/main/plugins/bundled/sqlite/sqlite-adapter'

async function fresh(): Promise<SqliteAdapter> {
  const a = new SqliteAdapter({ database: ':memory:' })
  await a.connect()
  await a.query('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)')
  return a
}

describe('SqliteAdapter sessions', () => {
  let a: SqliteAdapter
  beforeEach(async () => { a = await fresh() })

  it('rollback discards uncommitted inserts in an auto-commit-off session', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('x')", undefined, { sessionId: 's1' })
    await a.rollback('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(0)
  })

  it('commit persists inserts', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('y')", undefined, { sessionId: 's1' })
    await a.commit('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(1)
  })

  it('closeSession rolls back an open transaction', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('z')", undefined, { sessionId: 's1' })
    await a.closeSession('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(0)
  })
})
