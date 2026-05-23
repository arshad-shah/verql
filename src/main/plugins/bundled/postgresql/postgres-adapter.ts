import pg from 'pg'
import type { DbAdapter } from '../../../db/adapter'
import { quoteIdentifier } from '../../sdk/identifier'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, SchemaObject, FieldInfo, TestConnectionResult } from '@shared/types'

const PG_QUOTE = '"' as const

export class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool | null = null
  private config: pg.PoolConfig
  private currentDatabase: string
  private switchLock: Promise<void> = Promise.resolve()

  constructor(config: Record<string, unknown>) {
    this.currentDatabase = config.database as string
    // SSL verification is opt-out, not opt-in. Anything other than the explicit
    // 'no-verify' mode keeps `rejectUnauthorized: true`, so a connection that
    // claims to be encrypted actually verifies the server's certificate.
    // The previous default silently disabled verification for every SSL
    // connection, which let any on-path attacker intercept credentials with
    // a self-signed cert.
    const sslMode = config.sslMode as string | undefined
    this.config = {
      host: config.host as string,
      port: config.port as number,
      database: config.database as string,
      user: config.username as string | undefined,
      password: config.password as string | undefined,
      ssl: config.ssl ? { rejectUnauthorized: sslMode !== 'no-verify' } : false,
      max: 5,
      idleTimeoutMillis: 30000
    }
  }

  async connect(): Promise<void> {
    this.pool = new pg.Pool(this.config)
    const client = await this.pool.connect()
    client.release()
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query('SELECT version() as version')
    return { version: String(result.rows[0]?.version ?? 'unknown') }
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`SET search_path TO ${quoteIdentifier(schema, PG_QUOTE)}`)
  }

  async switchDatabase(database: string): Promise<void> {
    if (this.pool && this.currentDatabase === database) return
    // Serialize pool switches so concurrent calls don't destroy each other's pools
    const prev = this.switchLock
    let resolve!: () => void
    this.switchLock = new Promise<void>((r) => { resolve = r })
    try {
      await prev
      if (this.pool && this.currentDatabase === database) return
      await this.pool?.end()
      this.currentDatabase = database
      this.config = { ...this.config, database }
      this.pool = new pg.Pool(this.config)
      const client = await this.pool.connect()
      client.release()
    } finally {
      resolve()
    }
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
      `SELECT count(*) as cnt FROM ${quoteIdentifier([s, table], PG_QUOTE)}`
    )
    return parseInt(result.rows[0].cnt, 10)
  }

  async getSchemaObjects(schema?: string): Promise<SchemaObject[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const objects: SchemaObject[] = []

    // Materialized views (regular views are reported via getTables)
    const mvs = await this.pool.query(
      `SELECT matviewname AS name FROM pg_matviews WHERE schemaname = $1 ORDER BY matviewname`, [s]
    )
    for (const r of mvs.rows as { name: string }[]) {
      objects.push({ name: r.name, schema: s, kind: 'materialized_view' })
    }

    // Functions and procedures
    const funcs = await this.pool.query(
      `SELECT p.proname AS name,
              pg_get_function_arguments(p.oid) AS signature,
              pg_get_function_result(p.oid) AS return_type,
              p.prokind AS kind
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = $1
         AND p.prokind IN ('f','p')
       ORDER BY p.proname`,
      [s]
    )
    for (const r of funcs.rows as { name: string; signature: string; return_type: string; kind: 'f' | 'p' }[]) {
      objects.push({
        name: r.name,
        schema: s,
        kind: r.kind === 'p' ? 'procedure' : 'function',
        signature: r.signature ? `(${r.signature})` : '()',
        returnType: r.kind === 'f' ? r.return_type : undefined
      })
    }

    // Triggers
    const triggers = await this.pool.query(
      `SELECT tgname AS name, c.relname AS parent
       FROM pg_trigger t
       JOIN pg_class c ON c.oid = t.tgrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = $1 AND NOT t.tgisinternal
       ORDER BY tgname`,
      [s]
    )
    for (const r of triggers.rows as { name: string; parent: string }[]) {
      objects.push({ name: r.name, schema: s, kind: 'trigger', parent: r.parent })
    }

    // Sequences
    const seqs = await this.pool.query(
      `SELECT sequence_name AS name FROM information_schema.sequences WHERE sequence_schema = $1 ORDER BY sequence_name`,
      [s]
    )
    for (const r of seqs.rows as { name: string }[]) {
      objects.push({ name: r.name, schema: s, kind: 'sequence' })
    }

    // Indexes across all tables in the schema, excluding the implicit ones
    // created for primary keys (those are surfaced as PK markers on columns).
    const idx = await this.pool.query(
      `SELECT i.relname AS name,
              t.relname AS parent,
              CASE WHEN ix.indisunique THEN 'UNIQUE' ELSE '' END AS kind
       FROM pg_index ix
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_class t ON t.oid = ix.indrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = $1 AND NOT ix.indisprimary
       ORDER BY t.relname, i.relname`,
      [s]
    )
    for (const r of idx.rows as { name: string; parent: string; kind: string }[]) {
      objects.push({
        name: r.name,
        schema: s,
        kind: 'index',
        parent: r.parent,
        returnType: r.kind || undefined
      })
    }

    // Extensions installed in the database (not per-schema; we still surface
    // them under the 'public'-ish view since users expect to discover them here).
    if (s === 'public') {
      const exts = await this.pool.query(
        `SELECT extname AS name FROM pg_extension ORDER BY extname`
      )
      for (const r of exts.rows as { name: string }[]) {
        objects.push({ name: r.name, schema: s, kind: 'extension' })
      }
    }

    return objects
  }
}
