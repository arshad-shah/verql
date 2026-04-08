import type { SchemaAccess, SchemaSummary } from './types'
import type { DbAdapter } from '../../db/adapter'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

export class SchemaAccessImpl implements SchemaAccess {
  constructor(private getAdapter: (connectionId: string) => DbAdapter | undefined) {}

  private requireAdapter(connectionId: string): DbAdapter {
    const adapter = this.getAdapter(connectionId)
    if (!adapter) throw new Error(`No active connection: ${connectionId}`)
    return adapter
  }

  async getTables(connectionId: string, schema?: string): Promise<SchemaTable[]> {
    return this.requireAdapter(connectionId).getTables(schema)
  }

  async getColumns(connectionId: string, table: string, schema?: string): Promise<SchemaColumn[]> {
    return this.requireAdapter(connectionId).getColumns(table, schema)
  }

  async getIndexes(connectionId: string, table: string, schema?: string): Promise<SchemaIndex[]> {
    return this.requireAdapter(connectionId).getIndexes(table, schema)
  }

  async getSchemas(connectionId: string): Promise<string[]> {
    return this.requireAdapter(connectionId).getSchemas()
  }

  async getDatabases(connectionId: string): Promise<string[]> {
    return this.requireAdapter(connectionId).getDatabases()
  }

  async getSchemaSummary(connectionId: string, schema?: string): Promise<SchemaSummary> {
    const adapter = this.requireAdapter(connectionId)
    const tables = await adapter.getTables(schema)
    const result: SchemaSummary = { tables: [] }

    for (const table of tables) {
      const columns = await adapter.getColumns(table.name, schema)
      result.tables.push({
        name: table.name,
        columns: columns.map(col => ({
          name: col.name,
          dataType: col.dataType,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: col.isForeignKey,
          references: col.references
        }))
      })
    }

    return result
  }
}
