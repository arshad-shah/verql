import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, SchemaObject, TestConnectionResult } from '@shared/types'

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
  /**
   * Returns non-table schema objects (views, materialized views, functions,
   * procedures, triggers, sequences) for the given schema. Drivers that don't
   * support a kind simply omit it; the renderer renders whatever it gets.
   */
  getSchemaObjects?(schema?: string): Promise<SchemaObject[]>
}
