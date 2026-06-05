// Regression: SQLite query() chose all() vs run() by a leading-keyword guess
// (SELECT/PRAGMA/WITH). `INSERT/UPDATE/DELETE … RETURNING` returns rows but
// matches none of those, so it went down the run() path — discarding the
// RETURNING result set the user explicitly requested (and, depending on the
// better-sqlite3 version, throwing "This statement returns data"). The fix
// branches on the prepared statement's `reader` flag.
import { describe, it, expect } from 'vitest'
import { runPreparedStatement, type PreparedStatementLike } from '../../../src/main/plugins/bundled/sqlite/sqlite-adapter'

function fakeStmt(opts: {
  reader: boolean
  rows?: Record<string, unknown>[]
  columns?: { name: string; type?: string | null }[]
  changes?: number
}): PreparedStatementLike & { ran: boolean; alled: boolean } {
  return {
    reader: opts.reader,
    ran: false,
    alled: false,
    all(..._p: unknown[]) { this.alled = true; return opts.rows ?? [] },
    run(..._p: unknown[]) { this.ran = true; return { changes: opts.changes ?? 0 } },
    columns() { return opts.columns ?? [] },
  }
}

describe('runPreparedStatement', () => {
  it('returns rows for an INSERT … RETURNING (reader=true)', () => {
    const stmt = fakeStmt({
      reader: true,
      rows: [{ id: 1, name: 'a' }],
      columns: [{ name: 'id', type: 'INTEGER' }, { name: 'name', type: 'TEXT' }],
    })
    const result = runPreparedStatement(stmt, undefined, performance.now())
    expect(stmt.alled).toBe(true)
    expect(stmt.ran).toBe(false)
    expect(result.rows).toEqual([{ id: 1, name: 'a' }])
    expect(result.fields.map(f => f.name)).toEqual(['id', 'name'])
    expect(result.rowCount).toBe(1)
  })

  it('uses run() for a non-returning statement (reader=false)', () => {
    const stmt = fakeStmt({ reader: false, changes: 3 })
    const result = runPreparedStatement(stmt, undefined, performance.now())
    expect(stmt.ran).toBe(true)
    expect(stmt.alled).toBe(false)
    expect(result.rows).toEqual([])
    expect(result.affectedRows).toBe(3)
  })

  it('forwards bound params to all()/run()', () => {
    const reader = fakeStmt({ reader: true, rows: [] })
    let allArgs: unknown[] = []
    reader.all = (...p: unknown[]) => { allArgs = p; return [] }
    runPreparedStatement(reader, [1, 'x'], performance.now())
    expect(allArgs).toEqual([1, 'x'])

    const writer = fakeStmt({ reader: false })
    let runArgs: unknown[] = []
    writer.run = (...p: unknown[]) => { runArgs = p; return { changes: 0 } }
    runPreparedStatement(writer, [2, 'y'], performance.now())
    expect(runArgs).toEqual([2, 'y'])
  })
})
