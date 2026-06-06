import { describe, it, expect } from 'vitest'
import { stripSqlNoise, isSchemaMutatingSql, destructiveKind } from '../../src/renderer/src/lib/sql-classify'

describe('stripSqlNoise', () => {
  it('removes line and block comments', () => {
    expect(stripSqlNoise('SELECT 1 -- comment')).toBe('SELECT 1 ')
    expect(stripSqlNoise('SELECT /* x */ 1')).toBe('SELECT  1')
  })
})

describe('isSchemaMutatingSql', () => {
  it('detects DDL', () => {
    expect(isSchemaMutatingSql('CREATE TABLE t (id int)')).toBe(true)
    expect(isSchemaMutatingSql('ALTER TABLE t ADD c int')).toBe(true)
    expect(isSchemaMutatingSql('DROP TABLE t')).toBe(true)
  })
  it('ignores plain DML/SELECT', () => {
    expect(isSchemaMutatingSql('SELECT * FROM t')).toBe(false)
    expect(isSchemaMutatingSql('INSERT INTO t VALUES (1)')).toBe(false)
  })
  it('ignores DDL keywords that only appear in comments', () => {
    expect(isSchemaMutatingSql('SELECT 1 -- DROP TABLE t')).toBe(false)
  })
})

describe('destructiveKind', () => {
  it('flags DELETE/DROP/TRUNCATE', () => {
    expect(destructiveKind('DELETE FROM t')).toBe('delete-drop-truncate')
    expect(destructiveKind('DROP TABLE t')).toBe('delete-drop-truncate')
    expect(destructiveKind('TRUNCATE t')).toBe('delete-drop-truncate')
  })
  it('flags UPDATE without WHERE, but not with WHERE', () => {
    expect(destructiveKind('UPDATE t SET x = 1')).toBe('update-no-where')
    expect(destructiveKind('UPDATE t SET x = 1 WHERE id = 2')).toBeNull()
  })
  it('returns null for safe statements', () => {
    expect(destructiveKind('SELECT * FROM t')).toBeNull()
  })
})
