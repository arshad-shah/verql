import type { QueryResult, SchemaColumn } from '@shared/types'

export function generateInsertStatements(
  tableName: string,
  columns: SchemaColumn[],
  rows: Record<string, unknown>[]
): string {
  if (rows.length === 0) return `-- No data in ${tableName}\n`

  const colNames = columns.map(c => `"${c.name}"`).join(', ')
  const lines = rows.map(row => {
    const values = columns.map(c => formatSqlValue(row[c.name])).join(', ')
    return `INSERT INTO "${tableName}" (${colNames}) VALUES (${values});`
  })

  return lines.join('\n') + '\n'
}

export function generateCreateTable(
  tableName: string,
  columns: SchemaColumn[],
  dbType: string
): string {
  const colDefs = columns.map(c => {
    let def = `  "${c.name}" ${c.dataType}`
    if (c.isPrimaryKey) def += ' PRIMARY KEY'
    if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL'
    if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`
    return def
  })

  return `CREATE TABLE "${tableName}" (\n${colDefs.join(',\n')}\n);\n`
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
  output += generateInsertStatements(tableName, columns, rows)
  return output
}

function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  return `'${String(value).replace(/'/g, "''")}'`
}
