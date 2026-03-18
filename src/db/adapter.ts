import type { Connection, DbType } from '../config/store.js'
import { DbTimeoutError } from '../utils/errors.js'

function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Query'): Promise<T> {
  if (!ms || ms <= 0) return promise
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new DbTimeoutError(
        `${label} timed out after ${ms}ms. Use .cancel or increase timeout in connection settings.`,
        ms,
      )), ms)
    ),
  ])
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  duration: number
  affectedRows?: number
  error?: string
}

export interface TableInfo {
  name: string
  schema?: string
  type: 'table' | 'view' | 'system'
  rowCount?: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  references?: string
}

export interface IndexInfo {
  name: string
  columns: string[]
  unique: boolean
  type?: string
}

export interface ForeignKeyInfo {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  deleteRule?: string
  updateRule?: string
}

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getDatabases(): Promise<string[]>
  useDatabase(name: string): Promise<void>
  getTables(schema?: string): Promise<TableInfo[]>
  getSchemas(): Promise<string[]>
  getColumns(table: string, schema?: string): Promise<ColumnInfo[]>
  getIndexes(table: string, schema?: string): Promise<IndexInfo[]>
  getForeignKeys(table: string, schema?: string): Promise<any[]>
  getAllForeignKeys(schema?: string): Promise<ForeignKeyInfo[]>
  query(sql: string, params?: any[]): Promise<QueryResult>
  explain(sql: string): Promise<QueryResult>
  getCurrentDatabase(): string
  getServerInfo(): Promise<Record<string, string>>
  isConnected(): boolean
  getDbType(): DbType
  // ── New capabilities ──────────────────────────────────────────────────────
  getTableDDL(table: string, schema?: string): Promise<string>
  beginTransaction(): Promise<void>
  commitTransaction(): Promise<void>
  rollbackTransaction(): Promise<void>
  isInTransaction(): boolean
  truncateTable(table: string, schema?: string): Promise<void>
  dropTable(table: string, schema?: string): Promise<void>
  getTableRowCount(table: string, schema?: string): Promise<number>
}

// ─── PostgreSQL ───────────────────────────────────────────────────────────────

function buildPgSsl(conn: Connection): object | undefined {
  if (!conn.ssl) return undefined
  return { require: true, rejectUnauthorized: false }
}

function buildPgPoolConfig(conn: Connection, database?: string) {
  return {
    host: conn.host ?? 'localhost',
    port: conn.port ?? 5432,
    database: database ?? conn.database,
    user: conn.username,
    password: conn.password,
    ssl: buildPgSsl(conn),
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
}

async function createPgAdapter(conn: Connection): Promise<DbAdapter> {
  const { default: pg } = await import('pg')
  const { Pool } = pg
  if (conn.ssl) process.env.PGSSLMODE = 'require'
  else delete process.env.PGSSLMODE

  let pool: InstanceType<typeof Pool> | null = null
  let currentDb = conn.database
  let inTransaction = false

  return {
    async connect() {
      pool = new Pool(buildPgPoolConfig(conn))
      await pool.query('SELECT 1')
    },
    async disconnect() { await pool?.end(); pool = null },
    isConnected: () => pool !== null,
    getCurrentDatabase: () => currentDb,
    isInTransaction: () => inTransaction,
    getDbType: () => 'postgresql' as DbType,

    async getAllForeignKeys(schema = 'public') {
      const res = await pool!.query(
        `SELECT kcu.table_name AS from_table, kcu.column_name AS from_column,
           ccu.table_name AS to_table, ccu.column_name AS to_column,
           rc.delete_rule, rc.update_rule
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND kcu.table_schema=tc.table_schema
         JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema
         JOIN information_schema.referential_constraints rc ON rc.constraint_name=tc.constraint_name AND rc.constraint_schema=tc.table_schema
         WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema=$1`, [schema])
      return res.rows.map((r: any) => ({
        fromTable: r.from_table, fromColumn: r.from_column,
        toTable: r.to_table, toColumn: r.to_column,
        deleteRule: r.delete_rule, updateRule: r.update_rule,
      }))
    },
    async getDatabases() {
      const res = await pool!.query("SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname")
      return res.rows.map((r: any) => r.datname)
    },
    async useDatabase(name: string) {
      if (inTransaction) {
        try { await pool!.query('ROLLBACK') } catch {}
        inTransaction = false
      }
      await pool?.end()
      pool = new Pool(buildPgPoolConfig(conn, name))
      currentDb = name
    },
    async getSchemas() {
      const res = await pool!.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast') ORDER BY schema_name"
      )
      return res.rows.map((r: any) => r.schema_name)
    },
    async getTables(schema = 'public') {
      const res = await pool!.query(
        `SELECT t.table_name, t.table_type,
           COALESCE(s.n_live_tup, -1) as row_count
         FROM information_schema.tables t
         LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
         WHERE t.table_schema = $1
         ORDER BY t.table_name`, [schema])
      return res.rows.map((r: any) => ({
        name: r.table_name, schema,
        type: r.table_type === 'VIEW' ? 'view' : 'table',
        rowCount: r.row_count >= 0 ? Number(r.row_count) : undefined,
      }))
    },
    async getColumns(table: string, schema = 'public') {
      const res = await pool!.query(
        `SELECT c.column_name, c.data_type, c.is_nullable, c.column_default,
           CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_pk
         FROM information_schema.columns c
         LEFT JOIN (
           SELECT ku.column_name FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage ku ON tc.constraint_name=ku.constraint_name
           WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_name=$1 AND tc.table_schema=$2
         ) pk ON c.column_name=pk.column_name
         WHERE c.table_name=$1 AND c.table_schema=$2
         ORDER BY c.ordinal_position`, [table, schema])
      return res.rows.map((r: any) => ({
        name: r.column_name, type: r.data_type,
        nullable: r.is_nullable === 'YES',
        defaultValue: r.column_default, isPrimaryKey: r.is_pk,
      }))
    },
    async getIndexes(table: string, schema = 'public') {
      const res = await pool!.query(
        `SELECT i.relname as index_name, ix.indisunique as is_unique,
           array_agg(a.attname) as columns
         FROM pg_class t
         JOIN pg_index ix ON t.oid=ix.indrelid
         JOIN pg_class i ON i.oid=ix.indexrelid
         JOIN pg_namespace n ON n.oid=t.relnamespace
         JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=ANY(ix.indkey)
         WHERE t.relname=$1 AND n.nspname=$2
         GROUP BY i.relname, ix.indisunique`, [table, schema])
      return res.rows.map((r: any) => ({ name: r.index_name, columns: r.columns, unique: r.is_unique }))
    },
    async getForeignKeys(table: string, schema = 'public') {
      const res = await pool!.query(
        `SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column,
           rc.delete_rule, rc.update_rule
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name
         JOIN information_schema.referential_constraints rc ON rc.constraint_name=tc.constraint_name
         WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name=$1 AND tc.table_schema=$2`,
        [table, schema])
      return res.rows
    },
    async getTableDDL(table: string, schema = 'public') {
      // Reconstruct CREATE TABLE from catalog info
      const colRes = await pool!.query(
        `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
         FROM information_schema.columns WHERE table_name=$1 AND table_schema=$2
         ORDER BY ordinal_position`, [table, schema])
      const pkRes = await pool!.query(
        `SELECT kcu.column_name FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
         WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_name=$1 AND tc.table_schema=$2`,
        [table, schema])
      const pks = new Set(pkRes.rows.map((r: any) => r.column_name))
      const cols = colRes.rows.map((r: any) => {
        const type = r.character_maximum_length
          ? `${r.data_type}(${r.character_maximum_length})` : r.data_type
        const nullable = r.is_nullable === 'YES' ? '' : ' NOT NULL'
        const def = r.column_default ? ` DEFAULT ${r.column_default}` : ''
        const pk = pks.has(r.column_name) ? ' PRIMARY KEY' : ''
        return `  ${r.column_name} ${type}${nullable}${def}${pk}`
      })
      const idxRes = await pool!.query(
        `SELECT indexdef FROM pg_indexes WHERE tablename=$1 AND schemaname=$2 AND indexname NOT LIKE '%_pkey'`,
        [table, schema])
      const idxDefs = idxRes.rows.map((r: any) => r.indexdef + ';').join('\n')
      const ddl = `CREATE TABLE ${schema}.${table} (\n${cols.join(',\n')}\n);`
      return idxDefs ? `${ddl}\n\n${idxDefs}` : ddl
    },
    async beginTransaction() { await pool!.query('BEGIN'); inTransaction = true },
    async commitTransaction() { await pool!.query('COMMIT'); inTransaction = false },
    async rollbackTransaction() { await pool!.query('ROLLBACK'); inTransaction = false },
    async truncateTable(table: string, schema = 'public') {
      await pool!.query(`TRUNCATE TABLE "${schema}"."${table}" RESTART IDENTITY`)
    },
    async dropTable(table: string, schema = 'public') {
      await pool!.query(`DROP TABLE "${schema}"."${table}"`)
    },
    async getTableRowCount(table: string, schema = 'public') {
      const res = await pool!.query(`SELECT COUNT(*) as n FROM "${schema}"."${table}"`)
      return Number(res.rows[0].n)
    },
    async query(sql: string, params?: any[]): Promise<QueryResult> {
      const start = Date.now()
      const timeout = conn.queryTimeout ?? 30000
      try {
        const res = await withTimeout(pool!.query(sql, params), timeout)
        return {
          columns: res.fields?.map((f: any) => f.name) ?? [],
          rows: res.rows ?? [],
          rowCount: res.rowCount ?? res.rows?.length ?? 0,
          duration: Date.now() - start,
          affectedRows: res.rowCount ?? 0,
        }
      } catch (err: any) {
        return { columns: [], rows: [], rowCount: 0, duration: Date.now() - start, error: err.message }
      }
    },
    async explain(sql: string) { return this.query(`EXPLAIN ANALYZE ${sql}`) },
    async getServerInfo() {
      const res = await pool!.query(
        `SELECT version(), current_user, current_database(),
           pg_size_pretty(pg_database_size(current_database())) as db_size,
           pg_postmaster_start_time()::text as uptime`)
      const r = res.rows[0]
      return { version: r.version, user: r.current_user, database: r.current_database, size: r.db_size, uptime: r.uptime }
    },
  }
}

// ─── MySQL / MariaDB ──────────────────────────────────────────────────────────

async function createMysqlAdapter(conn: Connection): Promise<DbAdapter> {
  const mysql = await import('mysql2/promise')
  let pool: any = null
  let currentDb = conn.database
  let inTransaction = false

  return {
    async connect() {
      pool = mysql.createPool({
        host: conn.host ?? 'localhost', port: conn.port ?? 3306,
        database: conn.database, user: conn.username, password: conn.password,
        ssl: conn.ssl ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true, connectionLimit: 5,
        multipleStatements: false,
      })
      await pool.query('SELECT 1')
    },
    async disconnect() { await pool?.end(); pool = null },
    isConnected: () => pool !== null,
    getCurrentDatabase: () => currentDb,
    isInTransaction: () => inTransaction,
    getDbType: () => 'mysql' as DbType,

    async getAllForeignKeys(schema?: string) {
      const db = schema ?? currentDb
      const [rows]: any = await pool.query(
        `SELECT kcu.TABLE_NAME AS from_table, kcu.COLUMN_NAME AS from_column,
           kcu.REFERENCED_TABLE_NAME AS to_table, kcu.REFERENCED_COLUMN_NAME AS to_column,
           rc.DELETE_RULE AS delete_rule, rc.UPDATE_RULE AS update_rule
         FROM information_schema.KEY_COLUMN_USAGE kcu
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
           ON rc.CONSTRAINT_NAME=kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA=kcu.TABLE_SCHEMA
         WHERE kcu.TABLE_SCHEMA=? AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`, [db])
      return rows.map((r: any) => ({
        fromTable: r.from_table, fromColumn: r.from_column,
        toTable: r.to_table, toColumn: r.to_column,
        deleteRule: r.delete_rule, updateRule: r.update_rule,
      }))
    },
    async getDatabases() {
      const [rows]: any = await pool.query('SHOW DATABASES')
      return rows.map((r: any) => r.Database)
    },
    async useDatabase(name: string) {
      if (inTransaction) {
        try { await pool.query('ROLLBACK') } catch {}
        inTransaction = false
      }
      await pool.query(`USE \`${name}\``)
      currentDb = name
    },
    async getSchemas() { return this.getDatabases() },
    async getTables(schema?: string) {
      const db = schema ?? currentDb
      const [rows]: any = await pool.query(
        `SELECT TABLE_NAME, TABLE_TYPE, TABLE_ROWS FROM information_schema.TABLES
         WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME`, [db])
      return rows.map((r: any) => ({
        name: r.TABLE_NAME, schema: db,
        type: r.TABLE_TYPE === 'VIEW' ? 'view' : 'table', rowCount: r.TABLE_ROWS,
      }))
    },
    async getColumns(table: string, schema?: string) {
      const db = schema ?? currentDb
      const [rows]: any = await pool.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
         FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
         ORDER BY ORDINAL_POSITION`, [db, table])
      return rows.map((r: any) => ({
        name: r.COLUMN_NAME, type: r.COLUMN_TYPE,
        nullable: r.IS_NULLABLE === 'YES', defaultValue: r.COLUMN_DEFAULT,
        isPrimaryKey: r.COLUMN_KEY === 'PRI',
      }))
    },
    async getIndexes(table: string) {
      const [rows]: any = await pool.query(`SHOW INDEX FROM \`${table}\``)
      const grouped: Record<string, any> = {}
      for (const r of rows) {
        if (!grouped[r.Key_name]) grouped[r.Key_name] = { name: r.Key_name, columns: [], unique: !r.Non_unique }
        grouped[r.Key_name].columns.push(r.Column_name)
      }
      return Object.values(grouped)
    },
    async getForeignKeys(table: string, schema?: string) {
      const db = schema ?? currentDb
      const [rows]: any = await pool.query(
        `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME,
           DELETE_RULE, UPDATE_RULE
         FROM information_schema.KEY_COLUMN_USAGE kcu
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
           ON rc.CONSTRAINT_NAME=kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA=kcu.TABLE_SCHEMA
         WHERE kcu.TABLE_SCHEMA=? AND kcu.TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [db, table])
      return rows
    },
    async getTableDDL(table: string) {
      const [rows]: any = await pool.query(`SHOW CREATE TABLE \`${table}\``)
      return rows[0]?.['Create Table'] ?? ''
    },
    async beginTransaction() { await pool.query('START TRANSACTION'); inTransaction = true },
    async commitTransaction() { await pool.query('COMMIT'); inTransaction = false },
    async rollbackTransaction() { await pool.query('ROLLBACK'); inTransaction = false },
    async truncateTable(table: string) { await pool.query(`TRUNCATE TABLE \`${table}\``) },
    async dropTable(table: string) { await pool.query(`DROP TABLE \`${table}\``) },
    async getTableRowCount(table: string) {
      const [rows]: any = await pool.query(`SELECT COUNT(*) as n FROM \`${table}\``)
      return Number(rows[0].n)
    },
    async query(sql: string, params?: any[]): Promise<QueryResult> {
      const start = Date.now()
      const timeout = conn.queryTimeout ?? 30000
      try {
        const [rows, fields]: any = await withTimeout(pool.query(sql, params), timeout)
        const isArray = Array.isArray(rows)
        return {
          columns: fields?.map((f: any) => f.name) ?? [],
          rows: isArray ? rows : [],
          rowCount: isArray ? rows.length : (rows.affectedRows ?? 0),
          affectedRows: rows.affectedRows,
          duration: Date.now() - start,
        }
      } catch (err: any) {
        return { columns: [], rows: [], rowCount: 0, duration: Date.now() - start, error: err.message }
      }
    },
    async explain(sql: string) { return this.query(`EXPLAIN ${sql}`) },
    async getServerInfo() {
      const [rows]: any = await pool.query(
        `SELECT VERSION() as version, USER() as user, DATABASE() as db,
           @@datadir as datadir`)
      const r = rows[0]
      return { version: r.version, user: r.user, database: r.db, datadir: r.datadir }
    },
  }
}

// ─── SQLite ───────────────────────────────────────────────────────────────────

async function createSqliteAdapter(conn: Connection): Promise<DbAdapter> {
  let db: any = null
  let inTransaction = false

  return {
    async connect() {
      const { default: Database } = await import('better-sqlite3')
      db = new Database(conn.file ?? conn.database)
      db.pragma('journal_mode = WAL')
      db.pragma('foreign_keys = ON')
    },
    async disconnect() { db?.close(); db = null },
    isConnected: () => db !== null,
    getCurrentDatabase: () => conn.file ?? conn.database,
    isInTransaction: () => inTransaction,
    getDbType: () => 'sqlite' as DbType,

    async getAllForeignKeys() {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      const allFKs: ForeignKeyInfo[] = []
      for (const t of tables as any[]) {
        const fks = db.prepare(`PRAGMA foreign_key_list("${t.name}")`).all()
        for (const fk of fks as any[]) {
          allFKs.push({
            fromTable: t.name, fromColumn: fk.from,
            toTable: fk.table, toColumn: fk.to,
            deleteRule: fk.on_delete, updateRule: fk.on_update,
          })
        }
      }
      return allFKs
    },
    async getDatabases() { return [conn.file ?? conn.database] },
    async useDatabase() {},
    async getSchemas() { return ['main'] },
    async getTables() {
      const rows = db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name").all()
      return rows.map((r: any) => ({ name: r.name, type: r.type, schema: 'main' }))
    },
    async getColumns(table: string) {
      const rows = db.prepare(`PRAGMA table_info("${table}")`).all()
      return rows.map((r: any) => ({
        name: r.name, type: r.type, nullable: !r.notnull,
        defaultValue: r.dflt_value, isPrimaryKey: !!r.pk,
      }))
    },
    async getIndexes(table: string) {
      const rows = db.prepare(`PRAGMA index_list("${table}")`).all()
      return rows.map((r: any) => {
        const cols = db.prepare(`PRAGMA index_info("${r.name}")`).all()
        return { name: r.name, columns: cols.map((c: any) => c.name), unique: !!r.unique }
      })
    },
    async getForeignKeys(table: string) {
      return db.prepare(`PRAGMA foreign_key_list("${table}")`).all()
    },
    async getTableDDL(table: string) {
      const row = db.prepare("SELECT sql FROM sqlite_master WHERE name=?").get(table)
      // Also get indexes
      const idxRows = db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(table)
      const idxDefs = idxRows.map((r: any) => r.sql + ';').join('\n')
      return idxDefs ? `${row?.sql ?? ''};\n\n${idxDefs}` : `${row?.sql ?? ''};`
    },
    async beginTransaction() { db.prepare('BEGIN').run(); inTransaction = true },
    async commitTransaction() { db.prepare('COMMIT').run(); inTransaction = false },
    async rollbackTransaction() { db.prepare('ROLLBACK').run(); inTransaction = false },
    async truncateTable(table: string) { db.prepare(`DELETE FROM "${table}"`).run() },
    async dropTable(table: string) { db.prepare(`DROP TABLE "${table}"`).run() },
    async getTableRowCount(table: string) {
      const row = db.prepare(`SELECT COUNT(*) as n FROM "${table}"`).get()
      return Number(row.n)
    },
    async query(sql: string, params?: any[]): Promise<QueryResult> {
      const start = Date.now()
      try {
        const trimmed = sql.trim().toUpperCase()
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('EXPLAIN') || trimmed.startsWith('PRAGMA')) {
          const stmt = db.prepare(sql)
          const rows = stmt.all(...(params ?? []))
          const columns = rows.length > 0 ? Object.keys(rows[0]) : []
          return { columns, rows, rowCount: rows.length, duration: Date.now() - start }
        } else {
          const stmt = db.prepare(sql)
          const info = stmt.run(...(params ?? []))
          return { columns: [], rows: [], rowCount: 0, affectedRows: info.changes, duration: Date.now() - start }
        }
      } catch (err: any) {
        return { columns: [], rows: [], rowCount: 0, duration: Date.now() - start, error: err.message }
      }
    },
    // Note: SQLite is synchronous via better-sqlite3, so timeout isn't applied
    // at the query level. For truly long queries, users should cancel the process.
    async explain(sql: string) { return this.query(`EXPLAIN QUERY PLAN ${sql}`) },
    async getServerInfo() {
      const [row]: any = db.prepare('SELECT sqlite_version() as version').all()
      const { statSync } = await import('fs')
      let size = '?'
      try { size = `${Math.round(statSync(conn.file ?? conn.database).size / 1024)} KB` } catch {}
      return { version: row.version, file: conn.file ?? conn.database, size }
    },
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function createAdapter(conn: Connection): Promise<DbAdapter> {
  switch (conn.type) {
    case 'postgresql':
      try { await import('pg') } catch {
        throw new Error('PostgreSQL driver not installed. Run: npm install pg')
      }
      return createPgAdapter(conn)
    case 'mysql':
      try { await import('mysql2/promise') } catch {
        throw new Error('MySQL driver not installed. Run: npm install mysql2')
      }
      return createMysqlAdapter(conn)
    case 'sqlite':
      try { await import('better-sqlite3') } catch {
        throw new Error('SQLite driver not installed. Run: npm install better-sqlite3')
      }
      return createSqliteAdapter(conn)
    default: throw new Error(`Database type '${conn.type}' is not yet supported`)
  }
}

export const DB_TYPE_LABELS: Record<DbType, string> = {
  postgresql: '🐘 PostgreSQL',
  mysql: '🐬 MySQL / MariaDB',
  sqlite: '🗄️  SQLite',
  mssql: '🪟 SQL Server',
  mongodb: '🍃 MongoDB',
}

export const DB_TYPE_DEFAULTS: Record<DbType, { port?: number; host: string }> = {
  postgresql: { port: 5432, host: 'localhost' },
  mysql: { port: 3306, host: 'localhost' },
  sqlite: { host: '' },
  mssql: { port: 1433, host: 'localhost' },
  mongodb: { port: 27017, host: 'localhost' },
}
