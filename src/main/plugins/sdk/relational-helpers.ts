import type { DbAdapter } from '../../db/adapter'
import type { SchemaColumn } from '@shared/types'
import { quoteIdentifier, type SqlDialect } from '../../db/identifier'

/**
 * Build the data-fetch implementation that relational driver plugins should
 * use for their `getTableData` contribution. The dialect drives identifier
 * escaping so a hostile table name (introspected from a malicious server,
 * for example) can never break out of the SELECT statement.
 *
 * Non-relational drivers should NOT use this — they implement `getTableData`
 * themselves with their own query language (Mongo find, Redis SCAN, etc.).
 */
export function createRelationalGetTableData(dialect: SqlDialect) {
  return async function getTableData(
    adapter: DbAdapter,
    table: string,
    schema?: string
  ): Promise<{ rows: Record<string, unknown>[]; columns: SchemaColumn[] }> {
    const columns = await adapter.getColumns(table, schema)
    const qualified = schema
      ? quoteIdentifier([schema, table], dialect)
      : quoteIdentifier(table, dialect)
    const result = await adapter.query(`SELECT * FROM ${qualified}`)
    return { rows: result.rows, columns }
  }
}
