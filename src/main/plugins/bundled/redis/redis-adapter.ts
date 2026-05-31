import Redis, { type RedisOptions } from 'ioredis'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

export interface CommandResult {
  command: string
  value: unknown
}

export function parseRedisCommands(input: string): string[][] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(/\s+/))
}

function formatSingleValue(value: unknown): Record<string, unknown>[] {
  if (value === null) {
    return [{ value: '(nil)' }]
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => ({ index, value: item }))
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(([field, val]) => ({ field, value: val }))
  }

  return [{ value }]
}

export function formatRedisResult(results: CommandResult[]): QueryResult {
  const duration = 0
  const affectedRows = 0

  if (results.length === 1) {
    const rows = formatSingleValue(results[0].value)
    const fieldNames = rows.length > 0 ? Object.keys(rows[0]) : ['value']
    const fields: FieldInfo[] = fieldNames.map(name => ({ name, dataType: 'unknown', nullable: true }))
    return { rows, fields, rowCount: rows.length, duration, affectedRows }
  }

  // Multiple commands: include command column, separate with delimiter rows
  const rows: Record<string, unknown>[] = []

  for (let i = 0; i < results.length; i++) {
    const { command, value } = results[i]
    const valueRows = formatSingleValue(value)

    for (const row of valueRows) {
      rows.push({ command, ...row })
    }

    if (i < results.length - 1) {
      rows.push({ command: '---', value: '---' })
    }
  }

  const fieldNames = rows.length > 0 ? Object.keys(rows[0]) : ['command', 'value']
  const fields: FieldInfo[] = fieldNames.map(name => ({ name, dataType: 'unknown', nullable: true }))

  return { rows, fields, rowCount: rows.length, duration, affectedRows }
}

export class RedisAdapter implements DbAdapter {
  private client: Redis | null = null
  private readonly connectionOptions: RedisOptions | string
  private currentDatabase: number

  constructor(options: RedisOptions | string, database = 0) {
    this.connectionOptions = options
    this.currentDatabase = database
  }

  async connect(): Promise<void> {
    this.client = typeof this.connectionOptions === 'string'
      ? new Redis(this.connectionOptions)
      : new Redis(this.connectionOptions)
    if (this.currentDatabase !== 0) {
      await this.client.select(this.currentDatabase)
    }
    // Ping to verify connection
    await this.client.ping()
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.client) throw new Error('Not connected')
    const info = await this.client.info('server')
    const versionMatch = info.match(/redis_version:(.+)/)
    const version = versionMatch ? versionMatch[1].trim() : 'unknown'
    return { version: `Redis ${version}` }
  }

  async disconnect(): Promise<void> {
    await this.client?.quit()
    this.client = null
  }

  async isConnected(): Promise<boolean> {
    return this.client !== null && this.client.status === 'ready'
  }

  async query(input: string, _params?: unknown[]): Promise<QueryResult> {
    if (!this.client) throw new Error('Not connected')

    const start = performance.now()
    const commands = parseRedisCommands(input)

    const results: CommandResult[] = []

    for (const args of commands) {
      const [cmd, ...cmdArgs] = args
      // Dispatch through ioredis's command parser so unknown commands —
      // and Object.prototype-inherited methods like `toString` — surface
      // as proper Redis ERR replies instead of being reachable through
      // raw bracket access on the client instance.
      const value = await this.client.call(cmd, ...cmdArgs)
      results.push({ command: args.join(' '), value })
    }

    const duration = Math.round(performance.now() - start)
    const result = formatRedisResult(results)
    return { ...result, duration }
  }

  async getTables(_schema?: string): Promise<SchemaTable[]> {
    if (!this.client) throw new Error('Not connected')
    // Redis doesn't have tables — return key patterns as pseudo-tables
    const keys = await this.client.keys('*')
    const prefixes = new Set<string>()
    for (const key of keys) {
      const parts = key.split(':')
      if (parts.length > 1) {
        prefixes.add(parts[0])
      } else {
        prefixes.add(key)
      }
    }
    return Array.from(prefixes).map(name => ({
      name,
      schema: `db${this.currentDatabase}`,
      type: 'table' as const,
    }))
  }

  async getColumns(_table: string, _schema?: string): Promise<SchemaColumn[]> {
    // Redis is schema-less — no columns to introspect
    return []
  }

  async getIndexes(_table: string, _schema?: string): Promise<SchemaIndex[]> {
    // Redis has no indexes in the relational sense
    return []
  }

  async getRowCount(table: string, _schema?: string): Promise<number> {
    if (!this.client) throw new Error('Not connected')
    const keys = await this.client.keys(`${table}:*`)
    return keys.length
  }

  async getSchemas(): Promise<string[]> {
    return [`db${this.currentDatabase}`]
  }

  async getDatabases(): Promise<string[]> {
    if (!this.client) throw new Error('Not connected')
    const info = await this.client.info('keyspace')
    const dbPattern = /^db(\d+):/gm
    const dbs: string[] = []
    let match: RegExpExecArray | null
    while ((match = dbPattern.exec(info)) !== null) {
      dbs.push(`db${match[1]}`)
    }
    // Always include db0
    if (!dbs.includes('db0')) dbs.unshift('db0')
    return dbs
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.client) throw new Error('Not connected')
    const dbNum = parseInt(database.replace(/^db/, ''), 10)
    if (isNaN(dbNum)) throw new Error(`Invalid database: ${database}`)
    await this.client.select(dbNum)
    this.currentDatabase = dbNum
  }

  async cancelQuery(): Promise<void> {
    // Redis does not support query cancellation
  }
}
