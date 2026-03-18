import type { DbType } from '../config/store.js'

/**
 * Quote a SQL identifier (table/column/schema name) with double quotes,
 * escaping any embedded double quotes by doubling them.
 */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

/**
 * Build a fully-qualified table reference: "schema"."table" or just "table" for SQLite.
 */
export function quoteTable(table: string, schema: string, dbType: DbType): string {
  if (dbType === 'sqlite' || !schema || schema === 'main') return quoteIdent(table)
  if (dbType === 'mysql') return `\`${schema}\`.\`${table}\``
  return `${quoteIdent(schema)}.${quoteIdent(table)}`
}

/**
 * Return a SQL-safe string literal for embedding directly in SQL text.
 */
export function quoteLiteral(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return 'NULL'
    return String(val)
  }
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (val instanceof Date) return `'${val.toISOString()}'`
  return `'${String(val).replace(/'/g, "''")}'`
}

/**
 * Return the correct placeholder for a parameterized query.
 * MySQL uses `?`, PostgreSQL and SQLite use `$N`.
 */
export function placeholder(index: number, dbType: DbType): string {
  return dbType === 'mysql' ? '?' : `$${index}`
}

/**
 * Alias for placeholder with dbType-first argument order.
 */
export function ph(dbType: DbType, index: number): string {
  return placeholder(index, dbType)
}

/**
 * Build an array of placeholder strings for `count` parameters.
 */
export function buildPlaceholders(count: number, dbType: DbType, startAt = 1): string[] {
  return Array.from({ length: count }, (_, i) => placeholder(startAt + i, dbType))
}

/**
 * Properly split a SQL script into individual statements, respecting:
 * - String literals (single-quoted)
 * - PostgreSQL dollar-quoted strings ($tag$...$tag$)
 * - MySQL DELIMITER directives
 * - Line comments (--)
 * - Block comments
 */
export function splitSQLStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let i = 0
  let delimiter = ';'

  while (i < sql.length) {
    // -- line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i)
      if (end === -1) {
        current += sql.slice(i)
        break
      }
      current += sql.slice(i, end + 1)
      i = end + 1
      continue
    }

    // /* block comment */
    if (sql[i] === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      if (end === -1) {
        current += sql.slice(i)
        break
      }
      current += sql.slice(i, end + 2)
      i = end + 2
      continue
    }

    // Single-quoted string
    if (sql[i] === "'") {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2 // escaped quote
        } else if (sql[j] === "'") {
          j++
          break
        } else {
          j++
        }
      }
      current += sql.slice(i, j)
      i = j
      continue
    }

    // PostgreSQL dollar-quoted string: $tag$...$tag$
    if (sql[i] === '$') {
      const tagMatch = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/)
      if (tagMatch) {
        const tag = tagMatch[0]
        const endPos = sql.indexOf(tag, i + tag.length)
        if (endPos !== -1) {
          current += sql.slice(i, endPos + tag.length)
          i = endPos + tag.length
          continue
        }
      }
    }

    // MySQL DELIMITER directive (works regardless of current delimiter)
    const upper = sql.slice(i, i + 10).toUpperCase()
    if (upper.startsWith('DELIMITER') && (i === 0 || sql[i - 1] === '\n')) {
      const lineEnd = sql.indexOf('\n', i)
      const line = lineEnd === -1 ? sql.slice(i) : sql.slice(i, lineEnd)
      const newDelim = line.replace(/^DELIMITER\s+/i, '').trim()
      if (newDelim) {
        // Flush current buffer before changing delimiter
        const stmt = current.trim()
        if (stmt.length > 0) statements.push(stmt)
        current = ''
        delimiter = newDelim
        i = lineEnd === -1 ? sql.length : lineEnd + 1
        continue
      }
    }

    // Check for delimiter
    if (sql.slice(i, i + delimiter.length) === delimiter) {
      const stmt = current.trim()
      if (stmt.length > 0) statements.push(stmt)
      current = ''
      i += delimiter.length
      continue
    }

    current += sql[i]
    i++
  }

  const last = current.trim()
  if (last.length > 0) statements.push(last)

  return statements
}
