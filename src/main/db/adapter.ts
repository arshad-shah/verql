import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(sql: string, params?: unknown[]): Promise<QueryResult>
  getTables(schema?: string): Promise<SchemaTable[]>
  getColumns(table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(table: string, schema?: string): Promise<SchemaIndex[]>
  getSchemas(): Promise<string[]>
  getDatabases(): Promise<string[]>
  switchDatabase(database: string): Promise<void>
  setSchema?(schema: string): Promise<void>
  cancelQuery?(): void
  isConnected(): boolean
}
