import pg from 'pg'
import type { DbAdapter } from './adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

export class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool | null = null
  private config: pg.PoolConfig

  constructor(config: { host: string; port: number; database: string; user?: string; password?: string; ssl?: boolean }) {
    this.config = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000
    }
  }

  async connect(): Promise<void> {
    this.pool = new pg.Pool(this.config)
    const client = await this.pool.connect()
    client.release()
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`SET search_path TO "${schema}"`)
  }

  async switchDatabase(database: string): Promise<void> {
    await this.pool?.end()
    this.config = { ...this.config, database }
    this.pool = new pg.Pool(this.config)
    const client = await this.pool.connect()
    client.release()
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  isConnected(): boolean {
    return this.pool !== null
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = performance.now()
    const result = await this.pool.query(sql, params)
    const duration = Math.round(performance.now() - start)
    const fields: FieldInfo[] = (result.fields ?? []).map(f => ({
      name: f.name,
      dataType: String(f.dataTypeID),
      nullable: true
    }))
    return {
      rows: result.rows ?? [],
      fields,
      rowCount: result.rows?.length ?? 0,
      duration,
      affectedRows: result.rowCount ?? 0
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT table_name as name, table_type FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`, [s]
    )
    return result.rows.map((r: { name: string; table_type: string }) => ({
      name: r.name, schema: s, type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const colResult = await this.pool.query(
      `SELECT c.column_name as name, c.data_type, c.is_nullable, c.column_default FROM information_schema.columns c WHERE c.table_schema = $1 AND c.table_name = $2 ORDER BY c.ordinal_position`, [s, table]
    )
    const pkResult = await this.pool.query(
      `SELECT a.attname as column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE i.indisprimary AND c.relname = $1 AND n.nspname = $2`, [table, s]
    )
    const pkCols = new Set(pkResult.rows.map((r: { column_name: string }) => r.column_name))
    const fkResult = await this.pool.query(
      `SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column FROM information_schema.key_column_usage kcu JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_schema = $1 AND kcu.table_name = $2`, [s, table]
    )
    const fkMap = new Map(fkResult.rows.map((r: { column_name: string; ref_table: string; ref_column: string }) => [r.column_name, { table: r.ref_table, column: r.ref_column }]))
    return colResult.rows.map((r: { name: string; data_type: string; is_nullable: string; column_default: string | null }) => ({
      name: r.name, dataType: r.data_type, nullable: r.is_nullable === 'YES', defaultValue: r.column_default, isPrimaryKey: pkCols.has(r.name), isForeignKey: fkMap.has(r.name), references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT i.relname as index_name, ix.indisunique as is_unique, array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns FROM pg_class t JOIN pg_index ix ON t.oid = ix.indrelid JOIN pg_class i ON i.oid = ix.indexrelid JOIN pg_namespace n ON n.oid = t.relnamespace JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) WHERE t.relname = $1 AND n.nspname = $2 AND NOT ix.indisprimary GROUP BY i.relname, ix.indisunique`, [table, s]
    )
    return result.rows.map((r: { index_name: string; is_unique: boolean; columns: string[] }) => ({
      name: r.index_name, columns: r.columns, unique: r.is_unique
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name`
    )
    return result.rows.map((r: { schema_name: string }) => r.schema_name)
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false AND datallowconn = true ORDER BY datname`
    )
    return result.rows.map((r: { datname: string }) => r.datname)
  }

  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT count(*) as cnt FROM "${s}"."${table}"`
    )
    return parseInt(result.rows[0].cnt, 10)
  }
}
