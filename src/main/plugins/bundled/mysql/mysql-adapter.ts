import mysql from 'mysql2/promise'
import type { DbAdapter } from '../../../db/adapter'
import { quoteIdentifier } from '../../sdk/identifier'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

const MY_QUOTE = '`' as const

// MySQL FieldPacket flag bit 0 is NOT_NULL. The previous inline expression
// `(f.flags ?? 0 & 1) === 0` parsed as `(f.flags ?? 0) === 0` because `&`
// binds tighter than `??`, which mis-reported any column with any other
// bit set (PRI_KEY, UNIQUE_KEY, AUTO_INCREMENT, …) as NOT-nullable.
// mysql2 emits `flags` as either a numeric bitfield or — in some packet
// modes — an array of flag names, so we accept both shapes.
const MYSQL_NOT_NULL_FLAG = 1
export function isNullableFromMysqlFlags(
  flags: number | string[] | undefined | null,
): boolean {
  if (flags == null) return true
  if (Array.isArray(flags)) return !flags.includes('NOT_NULL')
  return (flags & MYSQL_NOT_NULL_FLAG) === 0
}

export class MysqlAdapter implements DbAdapter {
  private pool: mysql.Pool | null = null
  private config: mysql.PoolOptions

  constructor(config: Record<string, unknown>) {
    this.config = {
      host: config.host as string,
      port: config.port as number,
      database: config.database as string,
      user: config.username as string | undefined,
      password: config.password as string | undefined,
      ssl: config.ssl ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 5
    }
  }

  async connect(): Promise<void> {
    this.pool = mysql.createPool(this.config)
    const conn = await this.pool.getConnection()
    conn.release()
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query('SELECT VERSION() as version')
    const version = String((rows as Record<string, unknown>[])[0]?.version ?? 'unknown')
    return { version }
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`USE ${quoteIdentifier(database, MY_QUOTE)}`)
    this.config = { ...this.config, database }
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`USE ${quoteIdentifier(schema, MY_QUOTE)}`)
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  async isConnected(): Promise<boolean> { return this.pool !== null }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = performance.now()
    const [result, fields] = await this.pool.query(sql, params)
    const duration = Math.round(performance.now() - start)
    const isRows = Array.isArray(result)
    const rows = isRows ? (result as Record<string, unknown>[]) : []
    const fieldInfo: FieldInfo[] = (fields as mysql.FieldPacket[] ?? []).map(f => ({
      name: f.name, dataType: String(f.type), nullable: isNullableFromMysqlFlags(f.flags)
    }))
    return { rows, fields: fieldInfo, rowCount: rows.length, duration, affectedRows: isRows ? 0 : (result as mysql.ResultSetHeader).affectedRows ?? 0 }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(`SELECT table_name as name, table_type FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`, [db])
    return (rows as { name: string; table_type: string }[]).map(r => ({
      name: r.name, schema: db as string, type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [cols] = await this.pool.query(`SELECT column_name as name, data_type, is_nullable, column_default, column_key FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`, [db, table])
    const [fks] = await this.pool.query(`SELECT column_name, referenced_table_name, referenced_column_name FROM information_schema.key_column_usage WHERE table_schema = ? AND table_name = ? AND referenced_table_name IS NOT NULL`, [db, table])
    const fkMap = new Map((fks as { column_name: string; referenced_table_name: string; referenced_column_name: string }[]).map(r => [r.column_name, { table: r.referenced_table_name, column: r.referenced_column_name }]))
    return (cols as { name: string; data_type: string; is_nullable: string; column_default: string | null; column_key: string }[]).map(r => ({
      name: r.name, dataType: r.data_type, nullable: r.is_nullable === 'YES', defaultValue: r.column_default, isPrimaryKey: r.column_key === 'PRI', isForeignKey: fkMap.has(r.name), references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(`SELECT index_name, non_unique, GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name != 'PRIMARY' GROUP BY index_name, non_unique`, [db, table])
    return (rows as { index_name: string; non_unique: number; columns: string }[]).map(r => ({
      name: r.index_name, columns: r.columns.split(','), unique: r.non_unique === 0
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys') ORDER BY schema_name`)
    return (rows as { schema_name: string }[]).map(r => r.schema_name)
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`)
    return (rows as { schema_name: string }[]).map(r => r.schema_name)
  }

  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const db = (schema ?? this.config.database) as string
    const [rows] = await this.pool.query(
      `SELECT count(*) as cnt FROM ${quoteIdentifier([db, table], MY_QUOTE)}`
    )
    return (rows as { cnt: number }[])[0].cnt
  }
}
