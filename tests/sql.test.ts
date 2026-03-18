import { describe, it, expect } from 'vitest'
import { quoteIdent, quoteLiteral, buildPlaceholders, splitSQLStatements, quoteTable, ph } from '../src/utils/sql.js'

describe('quoteIdent', () => {
  it('quotes a normal identifier', () => {
    expect(quoteIdent('users')).toBe('"users"')
  })

  it('handles names with spaces', () => {
    expect(quoteIdent('my table')).toBe('"my table"')
  })

  it('escapes embedded double quotes', () => {
    expect(quoteIdent('my"table')).toBe('"my""table"')
  })

  it('handles empty string', () => {
    expect(quoteIdent('')).toBe('""')
  })
})

describe('quoteLiteral', () => {
  it('returns NULL for null', () => {
    expect(quoteLiteral(null)).toBe('NULL')
  })

  it('returns NULL for undefined', () => {
    expect(quoteLiteral(undefined)).toBe('NULL')
  })

  it('quotes strings with single quotes', () => {
    expect(quoteLiteral('hello')).toBe("'hello'")
  })

  it('escapes single quotes in strings', () => {
    expect(quoteLiteral("it's")).toBe("'it''s'")
  })

  it('returns numbers as-is', () => {
    expect(quoteLiteral(42)).toBe('42')
    expect(quoteLiteral(3.14)).toBe('3.14')
  })

  it('returns NULL for NaN', () => {
    expect(quoteLiteral(NaN)).toBe('NULL')
  })

  it('returns NULL for Infinity', () => {
    expect(quoteLiteral(Infinity)).toBe('NULL')
  })

  it('handles booleans', () => {
    expect(quoteLiteral(true)).toBe('TRUE')
    expect(quoteLiteral(false)).toBe('FALSE')
  })

  it('handles Date objects', () => {
    const d = new Date('2024-01-15T10:30:00.000Z')
    expect(quoteLiteral(d)).toBe("'2024-01-15T10:30:00.000Z'")
  })
})

describe('buildPlaceholders', () => {
  it('returns $N style for postgresql', () => {
    expect(buildPlaceholders(3, 'postgresql')).toEqual(['$1', '$2', '$3'])
  })

  it('returns $N style for sqlite', () => {
    expect(buildPlaceholders(2, 'sqlite')).toEqual(['$1', '$2'])
  })

  it('returns ? style for mysql', () => {
    expect(buildPlaceholders(3, 'mysql')).toEqual(['?', '?', '?'])
  })

  it('handles startAt offset', () => {
    expect(buildPlaceholders(2, 'postgresql', 5)).toEqual(['$5', '$6'])
  })

  it('returns empty array for count 0', () => {
    expect(buildPlaceholders(0, 'postgresql')).toEqual([])
  })
})

describe('quoteTable', () => {
  it('returns schema.table for postgresql', () => {
    expect(quoteTable('users', 'public', 'postgresql')).toBe('"public"."users"')
  })

  it('returns just table for sqlite', () => {
    expect(quoteTable('users', 'main', 'sqlite')).toBe('"users"')
  })

  it('uses backticks for mysql', () => {
    expect(quoteTable('users', 'mydb', 'mysql')).toBe('`mydb`.`users`')
  })
})

describe('ph', () => {
  it('returns ? for mysql', () => {
    expect(ph('mysql', 1)).toBe('?')
    expect(ph('mysql', 5)).toBe('?')
  })

  it('returns $N for postgresql', () => {
    expect(ph('postgresql', 1)).toBe('$1')
    expect(ph('postgresql', 3)).toBe('$3')
  })

  it('returns $N for sqlite', () => {
    expect(ph('sqlite', 2)).toBe('$2')
  })
})

describe('splitSQLStatements', () => {
  it('handles a single statement', () => {
    expect(splitSQLStatements('SELECT 1')).toEqual(['SELECT 1'])
  })

  it('handles multiple statements', () => {
    const result = splitSQLStatements('SELECT 1; SELECT 2;')
    expect(result).toEqual(['SELECT 1', 'SELECT 2'])
  })

  it('ignores semicolons inside string literals', () => {
    const result = splitSQLStatements("INSERT INTO t VALUES ('a;b'); SELECT 1;")
    expect(result).toEqual(["INSERT INTO t VALUES ('a;b')", 'SELECT 1'])
  })

  it('handles escaped quotes in strings', () => {
    const result = splitSQLStatements("SELECT 'it''s'; SELECT 2;")
    expect(result).toEqual(["SELECT 'it''s'", 'SELECT 2'])
  })

  it('handles PostgreSQL dollar-quoted strings', () => {
    const sql = `CREATE FUNCTION test() RETURNS void AS $$ BEGIN RAISE NOTICE 'hello; world'; END; $$ LANGUAGE plpgsql; SELECT 1;`
    const result = splitSQLStatements(sql)
    expect(result.length).toBe(2)
    expect(result[0]).toContain('$$ BEGIN')
    expect(result[1]).toBe('SELECT 1')
  })

  it('handles dollar-quoted strings with tags', () => {
    const sql = `CREATE FUNCTION foo() AS $fn$ BEGIN; END; $fn$ LANGUAGE plpgsql; SELECT 2;`
    const result = splitSQLStatements(sql)
    expect(result.length).toBe(2)
  })

  it('handles line comments', () => {
    const sql = `-- this is a comment\nSELECT 1; -- inline comment\nSELECT 2;`
    const result = splitSQLStatements(sql)
    expect(result.length).toBe(2)
  })

  it('handles block comments', () => {
    const sql = `/* multi\nline; comment */ SELECT 1; SELECT 2;`
    const result = splitSQLStatements(sql)
    expect(result.length).toBe(2)
  })

  it('handles MySQL DELIMITER', () => {
    const sql = `DELIMITER //\nCREATE PROCEDURE p() BEGIN SELECT 1; END//\nDELIMITER ;\nSELECT 2;`
    const result = splitSQLStatements(sql)
    expect(result.length).toBe(2)
    expect(result[0]).toContain('CREATE PROCEDURE')
    expect(result[1]).toBe('SELECT 2')
  })

  it('handles empty input', () => {
    expect(splitSQLStatements('')).toEqual([])
  })

  it('handles whitespace-only input', () => {
    expect(splitSQLStatements('   \n  ')).toEqual([])
  })
})
