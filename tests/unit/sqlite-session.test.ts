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

  it('re-begins a new transaction after commit within the same session', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('a')", undefined, { sessionId: 's1' })
    await a.commit('s1')
    // next query in the same auto-commit-off session must implicitly BEGIN again
    await a.query("INSERT INTO t (v) VALUES ('b')", undefined, { sessionId: 's1' })
    await a.rollback('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(1) // 'a' persisted, 'b' rolled back
  })

  it('setAutoCommit(true) commits the pending transaction', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('p')", undefined, { sessionId: 's1' })
    await a.setAutoCommit('s1', true)
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(1) // committed by the toggle
  })

  it('throws a legible error when a second session opens a concurrent transaction', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('x')", undefined, { sessionId: 's1' }) // s1 holds the txn
    await a.openSession('s2', { autoCommit: false })
    await expect(
      a.query("INSERT INTO t (v) VALUES ('y')", undefined, { sessionId: 's2' })
    ).rejects.toThrow(/one active transaction/i)
  })

  it('disconnect with an open transaction does not throw', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('z')", undefined, { sessionId: 's1' })
    await expect(a.disconnect()).resolves.toBeUndefined()
  })

  it('query with an unknown sessionId throws', async () => {
    await expect(a.query('SELECT 1', undefined, { sessionId: 'nope' })).rejects.toThrow(/no open session/i)
  })
})
