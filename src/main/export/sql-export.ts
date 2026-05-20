import type { QueryResult, SchemaColumn } from '@shared/types'
import { quoteIdentifier, type SqlDialect } from '../db/identifier'

const DIALECT_BY_TYPE: Record<string, SqlDialect> = {
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mysql: 'mysql',
  sqlite: 'sqlite'
}

function resolveDialect(dbType?: string): SqlDialect {
  return DIALECT_BY_TYPE[dbType ?? ''] ?? 'postgresql'
}

export function generateInsertStatements(
  tableName: string,
  columns: SchemaColumn[],
  rows: Record<string, unknown>[],
  dbType?: string
): string {
  const dialect = resolveDialect(dbType)
  if (rows.length === 0) return `-- No data in ${tableName}\n`

  const colNames = columns.map(c => quoteIdentifier(c.name, dialect)).join(', ')
  const qTable = quoteIdentifier(tableName, dialect)
  const lines = rows.map(row => {
    const values = columns.map(c => formatSqlValue(row[c.name])).join(', ')
    return `INSERT INTO ${qTable} (${colNames}) VALUES (${values});`
  })

  return lines.join('\n') + '\n'
}

export function generateCreateTable(
  tableName: string,
  columns: SchemaColumn[],
  dbType: string
): string {
  const dialect = resolveDialect(dbType)
  const colDefs = columns.map(c => {
    let def = `  ${quoteIdentifier(c.name, dialect)} ${c.dataType}`
    if (c.isPrimaryKey) def += ' PRIMARY KEY'
    if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL'
    if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`
    return def
  })

  return `CREATE TABLE ${quoteIdentifier(tableName, dialect)} (\n${colDefs.join(',\n')}\n);\n`
}

export function exportTableToSql(
  tableName: string,
  columns: SchemaColumn[],
  rows: Record<string, unknown>[],
  options: { includeSchema?: boolean; dbType?: string } = {}
): string {
  let output = ''
  if (options.includeSchema) {
    output += generateCreateTable(tableName, columns, options.dbType ?? 'postgresql')
    output += '\n'
  }
  output += generateInsertStatements(tableName, columns, rows, options.dbType)
  return output
}

function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  return `'${String(value).replace(/'/g, "''")}'`
}
