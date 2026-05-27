// Regression test: the MCP `explain_query` tool must NOT be a back door for
// running write statements without user approval.
//
// Postgres's simple-query protocol happily executes multiple statements when
// passed `EXPLAIN SELECT 1; DELETE FROM users`. The tool description sells it
// as "read-only", so an LLM client could call it with what looks like an
// EXPLAIN but actually carries a write payload after a semicolon. We pin
// that any write detected anywhere in the supplied SQL has to go through the
// same approval gate as the `query` tool.
import { describe, it, expect } from 'vitest'
import { isWriteQuery } from '../../../src/main/plugins/sdk/tool-schema'

describe('isWriteQuery — detects writes embedded in EXPLAIN payloads', () => {
  it('treats plain SELECTs as read-only', () => {
    expect(isWriteQuery('SELECT 1')).toBe(false)
    expect(isWriteQuery('   SELECT * FROM t')).toBe(false)
  })

  it('detects a write that hides after a semicolon', () => {
    expect(isWriteQuery('SELECT 1; DELETE FROM users')).toBe(true)
    expect(isWriteQuery('SELECT 1;\n  UPDATE accounts SET balance = 0')).toBe(true)
  })

  it('detects writes that hide behind a single-line SQL comment', () => {
    expect(isWriteQuery('-- innocent comment\nDROP TABLE users')).toBe(true)
  })

  it('detects writes that hide behind a block comment', () => {
    expect(isWriteQuery('/* hello */ TRUNCATE accounts')).toBe(true)
  })

  it('catches every common write verb', () => {
    for (const verb of [
      'INSERT INTO t VALUES (1)',
      'UPDATE t SET a = 1',
      'DELETE FROM t',
      'DROP TABLE t',
      'ALTER TABLE t ADD x int',
      'CREATE TABLE t (x int)',
      'TRUNCATE t',
      'REPLACE INTO t VALUES (1)',
      'MERGE INTO t USING s ON …',
      'GRANT ALL ON t TO public',
      'REVOKE ALL ON t FROM public',
    ]) {
      expect(isWriteQuery(verb)).toBe(true)
    }
  })
})
