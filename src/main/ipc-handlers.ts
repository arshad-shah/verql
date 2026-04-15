import { ipcMain, app, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import { ConfigStore } from './config/store'
import type { AppSettings } from '@shared/settings'
import { createAdapter, setDriverRegistry } from './db/factory'
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
import { PluginBootCoordinator } from './plugins/plugin-host'
import { DriverRegistryImpl } from './plugins/sdk/driver-registry'
import { CommandRegistryImpl } from './plugins/sdk/command-registry'
import { PanelRegistryImpl } from './plugins/sdk/panel-registry'
import { UIRegistryImpl } from './plugins/sdk/ui-registry'
import { safeCall } from './plugins/sdk/safe-call'
import { KeyringService } from './keyring'
import { createAIModule } from './ai'
import { SchemaAccessImpl } from './plugins/sdk/schema-access'
import { ConnectionAccessImpl } from './plugins/sdk/connection-access'
import * as sshPlugin from './plugins/bundled/ssh-tunnel'
import * as mongoPlugin from './plugins/bundled/mongodb'
import * as redisPlugin from './plugins/bundled/redis'
import * as snowflakePlugin from './plugins/bundled/snowflake'
import * as postgresqlPlugin from './plugins/bundled/postgresql'
import * as mysqlPlugin from './plugins/bundled/mysql'
import * as sqlitePlugin from './plugins/bundled/sqlite'
import * as aiPlugin from './plugins/bundled/ai'

const activeAdapters = new Map<string, DbAdapter>()
const keyring = new KeyringService()

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

  const driverRegistry = new DriverRegistryImpl()
  const commandRegistry = new CommandRegistryImpl()
  const panelRegistry = new PanelRegistryImpl()

  setDriverRegistry(driverRegistry)

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

  // ─── Settings ───────────────────────────────────────────────────────────────
  handle('settings:get-all', async () => {
    return configStore.getAllSettings()
  })

  handle('settings:get', async (category) => {
    return configStore.getSettingsCategory(category as keyof AppSettings)
  })

  handle('settings:set', async (keyPath, value) => {
    configStore.setSetting(keyPath as string, value)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow?.webContents.send('settings:changed', keyPath, value)
  })

  handle('settings:reset', async (category) => {
    configStore.resetCategory(category as keyof AppSettings)
    const updated = configStore.getSettingsCategory(category as keyof AppSettings)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow?.webContents.send('settings:changed', category, updated)
    return updated
  })

  handle('db:connect', async (profileId: string) => {
    try {
      let profile = configStore.getConnection(profileId)
      if (!profile) return { success: false, error: 'Connection profile not found — it may have been deleted' }
      if (activeAdapters.has(profileId)) return { success: true }

      // Run connection middleware chain
      for (const { middleware, pluginName } of driverRegistry.getMiddlewares()) {
        if (middleware.shouldApply(profile)) {
          profile = await safeCall(pluginName, () => middleware.beforeConnect(profile!), { timeoutMs: 15_000 })
        }
      }

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
    // Run middleware disconnect (e.g. close SSH tunnels)
    for (const { middleware, pluginName } of driverRegistry.getMiddlewares()) {
      try {
        await middleware.onDisconnect(profileId)
      } catch {
        // Ignore middleware cleanup errors
      }
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
      const result = await adapter.testConnection()
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })

  handle('db:connection-options', async (profile: ConnectionProfile, fields: string[]) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      if (!adapter.getConnectionOptions) {
        return {}
      }
      const result: Record<string, string[]> = {}
      for (const field of fields) {
        try {
          result[field] = await adapter.getConnectionOptions(field)
        } catch {
          result[field] = []
        }
      }
      return result
    } finally {
      await adapter?.disconnect()
    }
  })

  // ─── Keyring ──────────────────────────────────────────────────────────────────

  handle('keyring:store', async (profileId: string, key: string, value: string) => {
    await keyring.store(profileId, key, value)
  })

  handle('keyring:retrieve', async (profileId: string, key: string) => {
    return keyring.retrieve(profileId, key)
  })

  handle('keyring:delete', async (profileId: string, key: string) => {
    await keyring.delete(profileId, key)
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

  handle('db:get-row-count', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getRowCount(table, schema)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })

  handle('db:switch-database', async (profileId: string, database: string) => {
    if (!database) throw new Error('Database name is required')
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

  handle('db:switch-warehouse', async (profileId: string, warehouse: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    if (adapter.switchWarehouse) {
      await adapter.switchWarehouse(warehouse)
    }
  })

  handle('db:switch-role', async (profileId: string, role: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    if (adapter.switchRole) {
      await adapter.switchRole(role)
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

  // ─── Dialog ─────────────────────────────────────────────────────────────────

  handle('dialog:open-file', async (options) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: options?.title ?? 'Open File',
      filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const fullPath = filePaths[0]
    const content = fs.readFileSync(fullPath, 'utf-8')
    return { filePath: path.basename(fullPath), content }
  })

  handle('dialog:open-file-path', async (options) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: options?.title ?? 'Select File',
      filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }
    return { filePath: filePaths[0] }
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

  const uiRegistry = new UIRegistryImpl()

  const schemaAccess = new SchemaAccessImpl((id) => activeAdapters.get(id))
  const connectionAccess = new ConnectionAccessImpl(
    (id) => activeAdapters.get(id),
    (id) => configStore.getConnection(id)
  )

  const settingsStore = {
    get: (key: string): unknown => {
      const pluginSettings = configStore.getSettingsCategory('plugins')
      return pluginSettings[key]
    },
    set: (key: string, value: unknown): void => {
      configStore.setSetting(`plugins.${key}`, value)
    }
  }

  const aiModule = createAIModule({
    keyring,
    schemaAccess,
    connectionAccess,
    handle,
    settingsStore
  })

  const pluginCoordinator = new PluginBootCoordinator({
    driverRegistry,
    commandRegistry,
    panelRegistry,
    uiRegistry,
    getAdapter: (id) => activeAdapters.get(id),
    getProfile: (id) => configStore.getConnection(id),
    keyring,
    settingsStore,
    aiToolRegistry: aiModule.toolRegistry,
    aiProviderRegistry: aiModule.providerRegistry,
    aiConversationManager: aiModule.conversationManager
  })

  // Register bundled plugins
  pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
  pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
  pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
  pluginCoordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
  pluginCoordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
  pluginCoordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
  pluginCoordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)

  pluginCoordinator.boot().catch(err => {
    console.error('[plugins] Boot failed:', err)
  })

  function resolvePluginIcon(plugin: { manifest: { icon?: string }; path: string }): string | undefined {
    if (!plugin.manifest.icon || plugin.path === '<bundled>') return undefined
    const iconPath = path.resolve(plugin.path, plugin.manifest.icon)
    if (!fs.existsSync(iconPath)) return undefined
    const ext = path.extname(iconPath).toLowerCase()
    const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg'
    const data = fs.readFileSync(iconPath)
    return `data:${mime};base64,${data.toString('base64')}`
  }

  handle('plugins:list', async () => {
    return pluginCoordinator.getLoadedPlugins().map(p => ({
      name: p.manifest.name,
      displayName: p.manifest.displayName,
      version: p.manifest.version,
      description: p.manifest.description,
      bundled: p.path === '<bundled>',
      icon: resolvePluginIcon(p),
      status: p.status as { state: string; error?: string; phase?: string; contributions?: string[] },
      contributions: p.status.state === 'active' ? p.status.contributions
        : p.status.state === 'degraded' ? p.status.contributions
        : []
    }))
  })

  handle('plugins:activate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { success: false, error: 'Plugin not found' }
    const result = await pluginCoordinator.activatePlugin(plugin)
    if (result.status.state === 'error') {
      return { success: false, error: result.status.error }
    }
    return { success: true }
  })

  handle('plugins:deactivate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (plugin) await pluginCoordinator.deactivatePlugin(plugin)
  })

  handle('plugins:install-from-path', async (pluginPath) => {
    return pluginCoordinator.installFromPath(pluginPath)
  })

  handle('plugins:install-from-zip', async (zipPath) => {
    return pluginCoordinator.installFromZip(zipPath)
  })

  handle('plugins:open-install-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Plugin',
      properties: ['openFile', 'openDirectory'],
      filters: [{ name: 'Plugin Archive', extensions: ['zip'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  handle('plugins:uninstall', async (name) => {
    pluginCoordinator.uninstall(name)
  })

  handle('plugins:errors', async (name) => {
    return pluginCoordinator.getErrorBudget().getErrors(name)
  })

  handle('plugins:get-settings', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { schema: [], values: {} }
    const schema = plugin.manifest.contributes.settings ?? []
    const pluginSettings = (configStore.getSettingsCategory('plugins') as Record<string, unknown>)?.[name] as Record<string, unknown> | undefined
    const values: Record<string, unknown> = {}
    for (const setting of schema) {
      const stored = pluginSettings?.[setting.key]
      values[setting.key] = stored !== undefined ? stored : setting.default
    }
    return { schema, values }
  })

  handle('plugins:set-setting', async (name, key, value) => {
    configStore.setSetting(`plugins.${name}.${key}`, value)
  })

  handle('plugins:connection-fields', async () => {
    return driverRegistry.getDriverIds().map(id => {
      const factory = driverRegistry.get(id)!
      return {
        driverId: id,
        driverName: id,
        connectionFields: factory.connectionFields
      }
    })
  })

  handle('plugins:middleware-fields', async () => {
    const fields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[] = []
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.manifest.contributes.connectionFields) {
        fields.push(...plugin.manifest.contributes.connectionFields)
      }
    }
    return fields
  })

  // ─── Plugin UI ──────────────────────────────────────────────────────────────

  handle('plugins:ui:get-contributions', async (surface) => {
    const contributions: import('@shared/plugin-ui-types').UIContribution[] = []

    // Helper to resolve display name from plugin name
    const getDisplayName = (pluginName: string) => {
      const plugin = pluginCoordinator.getPlugin(pluginName)
      return plugin?.manifest.displayName ?? pluginName
    }

    // Registry-based surfaces: entries already track their owning plugin
    if (surface === 'statusBar') {
      for (const entry of uiRegistry.getAllStatusBars()) {
        const plugin = pluginCoordinator.getPlugin(entry.pluginName)
        const manifest = plugin?.manifest.contributes.statusBar?.find(s => s.id === entry.id)
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'statusBar',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: manifest ?? {}
        })
      }
    }

    if (surface === 'toolbar') {
      for (const entry of uiRegistry.getAllToolbars()) {
        const plugin = pluginCoordinator.getPlugin(entry.pluginName)
        const manifest = plugin?.manifest.contributes.toolbar?.find(s => s.id === entry.id)
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'toolbar',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: manifest ?? {}
        })
      }
    }

    if (surface === 'panels') {
      for (const entry of uiRegistry.getAllPanels()) {
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'panels',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    if (surface === 'tabs') {
      for (const entry of uiRegistry.getAllTabs()) {
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'tabs',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    // Manifest-based surfaces: still iterate plugins
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.status.state !== 'active' && plugin.status.state !== 'degraded') continue

      if (surface === 'contextMenu') {
        const menus = plugin.manifest.contributes.contextMenus
        if (menus) {
          for (const menu of menus) {
            contributions.push({
              pluginId: plugin.manifest.name,
              pluginName: plugin.manifest.displayName,
              surface: 'contextMenu',
              contributionId: menu.id,
              widgets: [],
              meta: { target: menu.target, label: menu.label, command: menu.command }
            })
          }
        }
      }

      if (surface === 'activityBar') {
        const bars = plugin.manifest.contributes.activityBar
        if (bars) {
          for (const bar of bars) {
            contributions.push({
              pluginId: plugin.manifest.name,
              pluginName: plugin.manifest.displayName,
              surface: 'activityBar',
              contributionId: bar.id,
              widgets: [],
              meta: { title: bar.title, icon: bar.icon, zone: bar.zone ?? 'top' }
            })
          }
        }
      }
    }

    return contributions
  })

  handle('plugins:ui:resolve', async (pluginId, resolverId, context) => {
    return pluginCoordinator.safeCallWithBudget(pluginId, () =>
      uiRegistry.resolve(resolverId, context)
    )
  })

  handle('plugins:ui:action', async (pluginId, commandId, payload) => {
    await pluginCoordinator.safeCallWithBudget(pluginId, () =>
      commandRegistry.execute(commandId, undefined, payload)
    )
  })

  // Forward UIRegistry changes to renderer
  uiRegistry.onChange(() => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('plugins:ui:contributions-changed')
  })
}
