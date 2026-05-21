import type { SchemaColumn } from '@shared/types'
import type { RegisteredExporter } from '../../sdk/exporter-registry'
import type { RegisteredImporter } from '../../sdk/importer-registry'
import { quoteIdentifier } from '../../../db/identifier'
import { splitSqlStatements } from '../../../import/sql-import'

const DIALECT = 'snowflake' as const

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  return `'${String(value).replace(/'/g, "''")}'`
}

function createTableDdl(tableName: string, columns: SchemaColumn[]): string {
  const colDefs = columns.map(c => {
    let def = `  ${quoteIdentifier(c.name, DIALECT)} ${c.dataType}`
    if (c.isPrimaryKey) def += ' PRIMARY KEY'
    if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL'
    if (c.defaultValue) def += ` DEFAULT ${c.defaultValue}`
    return def
  })
  return `CREATE TABLE ${quoteIdentifier(tableName, DIALECT)} (\n${colDefs.join(',\n')}\n);\n`
}

export const sqlExporter: RegisteredExporter = {
  format: 'sql',
  extension: 'sql',
  displayName: 'SQL (Snowflake)',
  appliesTo: (t) => t === 'snowflake',
  execute(rows, columns, options) {
    let output = ''
    if (options.includeSchema) {
      output += createTableDdl(options.tableName, columns) + '\n'
    }
    if (rows.length === 0) {
      output += `-- No data in ${options.tableName}\n`
      return output
    }
    const colNames = columns.map(c => quoteIdentifier(c.name, DIALECT)).join(', ')
    const qTable = quoteIdentifier(options.tableName, DIALECT)
    for (const row of rows) {
      const values = columns.map(c => formatValue(row[c.name])).join(', ')
      output += `INSERT INTO ${qTable} (${colNames}) VALUES (${values});\n`
    }
    return output
  }
}

export const sqlImporter: RegisteredImporter = {
  format: 'sql',
  extensions: ['sql'],
  displayName: 'SQL (Snowflake)',
  appliesTo: (t) => t === 'snowflake',
  driverExecutes: true,
  async parse(content, options) {
    const text = typeof content === 'string' ? content : content.toString('utf-8')
    const statements = splitSqlStatements(text)
    const adapter = options.adapter
    if (!adapter) throw new Error('SQL importer requires an active adapter')
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
    return { rows: [], executed, errors }
  }
}
