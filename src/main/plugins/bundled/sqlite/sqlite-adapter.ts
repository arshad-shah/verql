import Database from 'better-sqlite3'
import type { DbAdapter } from '../../../db/adapter'
import { quoteIdentifier } from '../../sdk/identifier'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

const SQLITE_QUOTE = '"' as const

export class SqliteAdapter implements DbAdapter {
  private db: Database.Database | null = null
  private dbPath: string
  private sessions = new Map<string, { autoCommit: boolean; inTxn: boolean }>()

  constructor(config: Record<string, unknown>) {
    this.dbPath = config.database as string
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.db) throw new Error('Not connected')
    const row = this.db.prepare('SELECT sqlite_version() as version').get() as { version: string }
    return { version: row.version }
  }

  async disconnect(): Promise<void> {
    for (const [, s] of this.sessions) { if (s.inTxn && this.db) this.db.prepare('ROLLBACK').run() }
    this.sessions.clear()
    this.db?.close()
    this.db = null
  }

  isConnected(): boolean {
    return this.db !== null
  }

  async query(sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')
    const session = opts?.sessionId ? this.sessions.get(opts.sessionId) : undefined
    if (session && !session.autoCommit && !session.inTxn) {
      this.db.prepare('BEGIN').run()
      session.inTxn = true
    }

    const start = performance.now()
    const trimmed = sql.trim().toUpperCase()
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')

    if (isSelect) {
      const stmt = this.db.prepare(sql)
      const rows = params ? stmt.all(...params) : stmt.all()
      const duration = Math.round(performance.now() - start)
      const columns = stmt.columns()
      const fields: FieldInfo[] = columns.map(c => ({
        name: c.name,
        dataType: c.type ?? 'unknown',
        nullable: true
      }))
      return { rows: rows as Record<string, unknown>[], fields, rowCount: rows.length, duration, affectedRows: 0 }
    } else {
      const stmt = this.db.prepare(sql)
      const info = params ? stmt.run(...params) : stmt.run()
      const duration = Math.round(performance.now() - start)
      return { rows: [], fields: [], rowCount: 0, duration, affectedRows: info.changes }
    }
  }

  async openSession(sessionId: string, opts?: { autoCommit?: boolean }): Promise<void> {
    if (!this.db) throw new Error('Not connected')
    if (this.sessions.has(sessionId)) return
    this.sessions.set(sessionId, { autoCommit: opts?.autoCommit ?? true, inTxn: false })
  }

  async closeSession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) this.db.prepare('ROLLBACK').run()
    this.sessions.delete(sessionId)
  }

  async setAutoCommit(sessionId: string, enabled: boolean): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (!s) return
    if (enabled && s.inTxn && this.db) { this.db.prepare('COMMIT').run(); s.inTxn = false }
    s.autoCommit = enabled
  }

  async beginTransaction(sessionId: string): Promise<void> {
    const s = this.requireSession(sessionId)
    if (s.inTxn || !this.db) return
    this.db.prepare('BEGIN').run()
    s.inTxn = true
  }

  async commit(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) { this.db.prepare('COMMIT').run(); s.inTxn = false }
  }

  async rollback(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) { this.db.prepare('ROLLBACK').run(); s.inTxn = false }
  }

  private requireSession(sessionId: string): { autoCommit: boolean; inTxn: boolean } {
    const s = this.sessions.get(sessionId)
    if (!s) throw new Error(`No open session '${sessionId}'`)
    return s
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare(
      "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string; type: string }[]
    return rows.map(r => ({
      name: r.name,
      schema: schema ?? 'main',
      type: r.type as 'table' | 'view'
    }))
  }

  async getColumns(table: string, _schema?: string): Promise<SchemaColumn[]> {
    if (!this.db) throw new Error('Not connected')
    const qt = quoteIdentifier(table, SQLITE_QUOTE)
    const rows = this.db.prepare(`PRAGMA table_info(${qt})`).all() as {
      cid: number; name: string; type: string; notnull: number; dflt_value: string | null; pk: number
    }[]
    const fkRows = this.db.prepare(`PRAGMA foreign_key_list(${qt})`).all() as {
      from: string; table: string; to: string
    }[]
    const fkMap = new Map(fkRows.map(fk => [fk.from, { table: fk.table, column: fk.to }]))
    return rows.map(r => ({
      name: r.name,
      dataType: r.type || 'TEXT',
      nullable: r.notnull === 0,
      defaultValue: r.dflt_value,
      isPrimaryKey: r.pk > 0,
      isForeignKey: fkMap.has(r.name),
      references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, _schema?: string): Promise<SchemaIndex[]> {
    if (!this.db) throw new Error('Not connected')
    const idxRows = this.db.prepare(`PRAGMA index_list(${quoteIdentifier(table, SQLITE_QUOTE)})`).all() as {
      name: string; unique: number
    }[]
    return idxRows.map(idx => {
      const cols = this.db!.prepare(`PRAGMA index_info(${quoteIdentifier(idx.name, SQLITE_QUOTE)})`).all() as { name: string }[]
      return {
        name: idx.name,
        columns: cols.map(c => c.name),
        unique: idx.unique === 1
      }
    })
  }

  async getRowCount(table: string, _schema?: string): Promise<number> {
    if (!this.db) throw new Error('Not connected')
    const row = this.db.prepare(`SELECT count(*) as cnt FROM ${quoteIdentifier(table, SQLITE_QUOTE)}`).get() as { cnt: number }
    return row.cnt
  }

  async getSchemas(): Promise<string[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare('PRAGMA database_list').all() as { name: string }[]
    return rows.map(r => r.name)
  }

  async getDatabases(): Promise<string[]> {
    return [this.dbPath.split('/').pop() ?? this.dbPath]
  }

  async switchDatabase(_database: string): Promise<void> {
    throw new Error('SQLite does not support switching databases')
  }
}
