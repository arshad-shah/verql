import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, TestConnectionResult } from '@shared/types'

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  testConnection(): Promise<TestConnectionResult>
  query(sql: string, params?: unknown[]): Promise<QueryResult>
  getTables(schema?: string): Promise<SchemaTable[]>
  getColumns(table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(table: string, schema?: string): Promise<SchemaIndex[]>
  getRowCount(table: string, schema?: string): Promise<number>
  getSchemas(): Promise<string[]>
  getDatabases(): Promise<string[]>
  switchDatabase(database: string): Promise<void>
  setSchema?(schema: string): Promise<void>
  switchWarehouse?(warehouse: string): Promise<void>
  switchRole?(role: string): Promise<void>
  cancelQuery?(): void
  isConnected(): boolean
  getConnectionOptions?(field: string): Promise<string[]>
}
