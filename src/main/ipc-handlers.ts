import { ipcMain, app, dialog } from 'electron'
import fs from 'fs'
import { ConfigStore } from './config/store'
import { createAdapter } from './db/factory'
import type { DbAdapter } from './db/adapter'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import type { IpcChannelMap } from '@shared/ipc'
import path from 'path'
import { exportTableToSql } from './export/sql-export'
import { exportToCsv } from './export/csv-export'
import { exportToJson } from './export/json-export'
import { parseCsvFile, importCsvToTable } from './import/csv-import'
import { executeSqlFile } from './import/sql-import'
import { mapType, generateMigrationDdl } from './migration/type-map'
import { loadPlugins, getLoadedPlugins, activatePlugin, deactivatePlugin, installPluginFromPath, uninstallPlugin } from './plugins/plugin-host'

const activeAdapters = new Map<string, DbAdapter>()

/** Turn raw database errors into user-friendly messages */
function formatDbError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const code = (err as { code?: string }).code

  // PostgreSQL error codes
  if (code === '42P01') return `Table not found: ${extractDetail(raw, 'relation')}`
  if (code === '42703') return `Column not found: ${extractDetail(raw, 'column')}`
  if (code === '42601') return `SQL syntax error — check your query near the highlighted position`
  if (code === '28P01') return 'Authentication failed — check your username and password'
  if (code === '3D000') return 'Database does not exist — check the database name in your connection'
  if (code === '28000') return 'Authentication failed — user not authorized'
  if (code === '08001' || code === '08006') return 'Could not connect to server — check host and port'
  if (code === '57014') return 'Query was cancelled'
  if (code === '23505') return `Duplicate value violates unique constraint: ${extractDetail(raw, 'constraint')}`
  if (code === '23503') return `Foreign key violation: ${extractDetail(raw, 'constraint')}`
  if (code === '42501') return 'Permission denied — insufficient privileges for this operation'
  if (code === '53300') return 'Too many connections — try closing unused connections'
  if (code === '57P03') return 'Database is starting up — try again in a moment'

  // MySQL error codes
  if (code === 'ER_NO_SUCH_TABLE') return `Table not found: ${extractDetail(raw, "'")}`
  if (code === 'ER_BAD_FIELD_ERROR') return `Unknown column: ${extractDetail(raw, "'")}`
  if (code === 'ER_PARSE_ERROR') return 'SQL syntax error — check your query'
  if (code === 'ER_ACCESS_DENIED_ERROR') return 'Authentication failed — check your username and password'
  if (code === 'ER_BAD_DB_ERROR') return 'Database does not exist — check the database name'
  if (code === 'ER_DUP_ENTRY') return `Duplicate entry: ${raw}`

  // Network-level errors
  if (code === 'ECONNREFUSED') return 'Connection refused — is the database server running?'
  if (code === 'ENOTFOUND') return 'Host not found — check the hostname in your connection'
  if (code === 'ETIMEDOUT') return 'Connection timed out — check host, port, and firewall settings'
  if (code === 'ECONNRESET') return 'Connection was reset — the server may have restarted'

  // SQLite errors
  if (raw.includes('no such table')) return `Table not found: ${extractDetail(raw, 'table:')}`
  if (raw.includes('SQLITE_READONLY')) return 'Database is read-only'
  if (raw.includes('SQLITE_BUSY')) return 'Database is locked — another process may be using it'

  return raw
}

function extractDetail(msg: string, keyword: string): string {
  const patterns: Record<string, RegExp> = {
    relation: /relation "([^"]+)"/,
    column: /column "([^"]+)"/,
    constraint: /constraint "([^"]+)"/,
    "'": /'([^']+)'/,
    'table:': /table:\s*(\S+)/
  }
  const pattern = patterns[keyword]
  if (!pattern) return msg
  const match = msg.match(pattern)
  return match?.[1] ?? msg
}

function handle<K extends keyof IpcChannelMap>(
  channel: K,
  handler: (...args: IpcChannelMap[K]['args']) => IpcChannelMap[K]['return'] | Promise<IpcChannelMap[K]['return']>
) {
  ipcMain.handle(channel, (_event, ...args) =>
    handler(...(args as IpcChannelMap[K]['args']))
  )
}

export function registerIpcHandlers(): void {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  const configStore = new ConfigStore(configPath)
  handle('connections:list', () => configStore.listConnections())

  handle('connections:save', (profile: ConnectionProfile) =>
    configStore.saveConnection(profile)
  )

  handle('connections:delete', (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter) {
      adapter.disconnect()
      activeAdapters.delete(profileId)
    }
    configStore.deleteConnection(profileId)
  })

  handle('db:connect', async (profileId: string) => {
    try {
      const profile = configStore.getConnection(profileId)
      if (!profile) return { success: false, error: 'Connection profile not found — it may have been deleted' }
      if (activeAdapters.has(profileId)) return { success: true }
      const adapter = createAdapter(profile)
      await adapter.connect()
      activeAdapters.set(profileId, adapter)
      return { success: true }
    } catch (err) {
      return { success: false, error: formatDbError(err) }
    }
  })

  handle('db:disconnect', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter) {
      await adapter.disconnect()
      activeAdapters.delete(profileId)
    }
  })

  handle('db:query', async (profileId: string, sql: string, params?: unknown[]) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection from the sidebar first')
    try {
      return await adapter.query(sql, params)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:test-connection', async (profile: ConnectionProfile) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      const result = await adapter.query(
        profile.type === 'sqlite'
          ? 'SELECT sqlite_version() as version'
          : profile.type === 'postgresql'
            ? 'SELECT version() as version'
            : 'SELECT VERSION() as version'
      )
      const version = String(result.rows[0]?.version ?? 'unknown')
      return { success: true, version }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })

  handle('db:get-tables', async (profileId: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getTables(schema)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:get-columns', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getColumns(table, schema)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:get-indexes', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getIndexes(table, schema)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:get-schemas', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getSchemas()
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:get-databases', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getDatabases()
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:switch-database', async (profileId: string, database: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      await adapter.switchDatabase(database)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:set-schema', async (profileId: string, schema: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    if (adapter.setSchema) {
      await adapter.setSchema(schema)
    }
  })

  handle('db:cancel-query', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter?.cancelQuery) {
      adapter.cancelQuery()
    }
  })

  handle('db:get-table-names', async (profileId: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      const tables = await adapter.getTables(schema)
      return tables.map(t => t.name)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  // ─── Export ──────────────────────────────────────────────────────────────────

  handle('export:table', async (profileId, tableName, format, options) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const schema = options?.schema
    const columns = await adapter.getColumns(tableName, schema)
    const result = await adapter.query(`SELECT * FROM "${tableName}"`)
    const profile = configStore.getConnection(profileId)

    let content: string
    let defaultExt: string
    if (format === 'sql') {
      content = exportTableToSql(tableName, columns, result.rows, { includeSchema: options?.includeSchema, dbType: profile?.type })
      defaultExt = 'sql'
    } else if (format === 'csv') {
      content = exportToCsv(result.rows, columns.map(c => c.name))
      defaultExt = 'csv'
    } else {
      content = exportToJson(result.rows)
      defaultExt = 'json'
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `${tableName}.${defaultExt}`,
      filters: [{ name: format.toUpperCase(), extensions: [defaultExt] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { filePath }
  })

  handle('export:query-result', async (rows, fields, format) => {
    let content: string
    let defaultExt: string
    if (format === 'csv') {
      content = exportToCsv(rows, fields)
      defaultExt = 'csv'
    } else {
      content = exportToJson(rows)
      defaultExt = 'json'
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `query-result.${defaultExt}`,
      filters: [{ name: format.toUpperCase(), extensions: [defaultExt] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { filePath }
  })

  // ─── Import ──────────────────────────────────────────────────────────────────

  handle('import:csv', async (profileId, tableName, columnMapping, onConflict) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'CSV', extensions: ['csv', 'tsv'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const content = fs.readFileSync(filePaths[0], 'utf-8')
    const { rows } = parseCsvFile(content)
    return importCsvToTable(adapter, rows, { tableName, columnMapping, onConflict })
  })

  handle('import:sql', async (profileId) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'SQL', extensions: ['sql'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const content = fs.readFileSync(filePaths[0], 'utf-8')
    return executeSqlFile(adapter, content)
  })

  // ─── Migration ───────────────────────────────────────────────────────────────

  handle('migration:type-map', async (sourceType, from, to) => {
    return mapType(sourceType, from, to)
  })

  handle('migration:generate-ddl', async (tableName, columns, from, to) => {
    return generateMigrationDdl(tableName, columns, from, to)
  })

  // ─── Plugins ─────────────────────────────────────────────────────────────────

  loadPlugins()

  handle('plugins:list', async () => {
    return getLoadedPlugins().map(p => ({
      name: p.manifest.name,
      displayName: p.manifest.displayName,
      version: p.manifest.version,
      description: p.manifest.description,
      active: p.active,
      error: p.error
    }))
  })

  handle('plugins:activate', async (name) => {
    return activatePlugin(name)
  })

  handle('plugins:deactivate', async (name) => {
    deactivatePlugin(name)
  })

  handle('plugins:install-from-path', async (pluginPath) => {
    return installPluginFromPath(pluginPath)
  })

  handle('plugins:uninstall', async (name) => {
    uninstallPlugin(name)
  })
}
