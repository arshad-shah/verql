import type { DbAdapter } from '../db/adapter'

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]

    if (inString) {
      current += ch
      if (ch === stringChar && sql[i + 1] !== stringChar) {
        inString = false
      } else if (ch === stringChar && sql[i + 1] === stringChar) {
        current += sql[++i] // skip escaped quote
      }
      continue
    }

    if (ch === "'" || ch === '"') {
      inString = true
      stringChar = ch
      current += ch
      continue
    }

    if (ch === '-' && sql[i + 1] === '-') {
      // line comment — skip to end of line
      while (i < sql.length && sql[i] !== '\n') i++
      continue
    }

    if (ch === '/' && sql[i + 1] === '*') {
      // block comment — skip to */
      i += 2
      while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i++ // skip past /
      continue
    }

    if (ch === ';') {
      const stmt = current.trim()
      if (stmt) statements.push(stmt)
      current = ''
      continue
    }

    current += ch
  }

  const last = current.trim()
  if (last) statements.push(last)

  return statements
}

export async function executeSqlFile(
  adapter: DbAdapter,
  sql: string
): Promise<{ executed: number; errors: string[] }> {
  const statements = splitSqlStatements(sql)
  let executed = 0
  const errors: string[] = []

  for (let i = 0; i < statements.length; i++) {
    try {
      await adapter.query(statements[i])
      executed++
    } catch (err) {
      errors.push(`Statement ${i + 1}: ${(err as Error).message}`)
    }
  }

  return { executed, errors }
}
