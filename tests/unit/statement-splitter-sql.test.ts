import { describe, it, expect } from 'vitest'
import { splitSqlStatements } from '@/lib/statement-contributions/sql'

describe('splitSqlStatements', () => {
  it('returns empty for empty/whitespace input', () => {
    expect(splitSqlStatements('')).toEqual([])
    expect(splitSqlStatements('   \n  \t  ')).toEqual([])
  })

  it('splits on top-level semicolons', () => {
    const r = splitSqlStatements('SELECT 1; SELECT 2;')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1', 'SELECT 2'])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(1)
    expect(r[0].startColumn).toBe(1)
    expect(r[1].startColumn).toBeGreaterThan(r[0].endColumn)
  })

  it('detects boundary on newline + statement keyword (no semicolon)', () => {
    const r = splitSqlStatements('SELECT 1\nSELECT 2')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1', 'SELECT 2'])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(2)
  })

  it('handles mixed terminators', () => {
    const r = splitSqlStatements('SELECT 1;\nUPDATE t SET x=1 WHERE id=1\nDELETE FROM t WHERE id=2;')
    expect(r.map((s) => s.text)).toEqual([
      'SELECT 1',
      'UPDATE t SET x=1 WHERE id=1',
      'DELETE FROM t WHERE id=2',
    ])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(2)
    expect(r[2].startLine).toBe(3)
  })

  it('ignores semicolons inside string literals', () => {
    const r = splitSqlStatements("SELECT ';not a delim;'; SELECT 2")
    expect(r.map((s) => s.text)).toEqual(["SELECT ';not a delim;'", 'SELECT 2'])
  })

  it('ignores keywords inside line and block comments', () => {
    const r = splitSqlStatements('SELECT 1 -- SELECT fake\n/* SELECT also fake */\n;\nSELECT 2')
    expect(r).toHaveLength(2)
    expect(r[0].text.startsWith('SELECT 1')).toBe(true)
    expect(r[1].text.startsWith('SELECT 2')).toBe(true)
  })

  it('captures full statement range (multi-line)', () => {
    const r = splitSqlStatements('SELECT\n  *\nFROM t')
    expect(r).toHaveLength(1)
    expect(r[0].startLine).toBe(1)
    expect(r[0].endLine).toBe(3)
  })

  it('emits one statement when no terminator and no keyword break', () => {
    const r = splitSqlStatements('SELECT a, b, c FROM t WHERE x = 1')
    expect(r).toHaveLength(1)
  })

  it('drops empty segments from trailing semicolons', () => {
    const r = splitSqlStatements('SELECT 1;;\n;')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1'])
  })

  it('handles WITH (CTE) as a statement starter', () => {
    const r = splitSqlStatements('SELECT 1\nWITH cte AS (SELECT 1) SELECT * FROM cte')
    expect(r).toHaveLength(2)
    expect(r[1].text.startsWith('WITH')).toBe(true)
  })
})
