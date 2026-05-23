import type { RegisteredExporter } from '../../sdk/exporter-registry'
import type { RegisteredImporter } from '../../sdk/importer-registry'
import { quoteIdentifier } from '../../sdk/identifier'
import { splitSqlStatements } from '../../sdk/sql-statements'
import { formatSqlValue, generateCreateTable } from '../../sdk/sql-format'

const SNOWFLAKE_QUOTE = '"' as const

export const sqlExporter: RegisteredExporter = {
  format: 'sql',
  extension: 'sql',
  displayName: 'SQL (Snowflake)',
  appliesTo: (t) => t === 'snowflake',
  execute(rows, columns, options) {
    let output = ''
    if (options.includeSchema) {
      output += generateCreateTable(options.tableName, columns, SNOWFLAKE_QUOTE) + '\n'
    }
    if (rows.length === 0) {
      output += `-- No data in ${options.tableName}\n`
      return output
    }
    const colNames = columns.map(c => quoteIdentifier(c.name, SNOWFLAKE_QUOTE)).join(', ')
    const qTable = quoteIdentifier(options.tableName, SNOWFLAKE_QUOTE)
    for (const row of rows) {
      const values = columns.map(c => formatSqlValue(row[c.name])).join(', ')
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
