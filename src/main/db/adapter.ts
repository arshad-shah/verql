import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, SchemaObject, TestConnectionResult, PlanNode } from '@shared/types'
import type { SessionOpts } from '@shared/driver-capabilities'

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  testConnection(): Promise<TestConnectionResult>
  query(sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }): Promise<QueryResult>
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
  cancelQuery?(): Promise<void>
  isConnected(): Promise<boolean>
  getConnectionOptions?(field: string): Promise<string[]>
  /**
   * Parse this driver's EXPLAIN output (the rows of an EXPLAIN query) into a
   * normalized PlanNode tree. Drivers that support query plans implement it
   * (e.g. Postgres parses its text/JSON plan); others omit it and the renderer
   * shows no plan. Keeps dialect-specific plan parsing inside the driver.
   */
  parseQueryPlan?(result: QueryResult): PlanNode[]
  /**
   * Returns non-table schema objects (views, materialized views, functions,
   * procedures, triggers, sequences) for the given schema. Drivers that don't
   * support a kind simply omit it; the renderer renders whatever it gets.
   */
  getSchemaObjects?(schema?: string): Promise<SchemaObject[]>
  /** Pin a dedicated connection for this session (auto-commit off / manual txn). */
  openSession?(sessionId: string, opts?: SessionOpts): Promise<void>
  /** Release the pinned connection. Rolls back any open txn first. */
  closeSession?(sessionId: string): Promise<void>
  setAutoCommit?(sessionId: string, enabled: boolean): Promise<void>
  beginTransaction?(sessionId: string, opts?: SessionOpts): Promise<void>
  commit?(sessionId: string): Promise<void>
  rollback?(sessionId: string): Promise<void>
}
