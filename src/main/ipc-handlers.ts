import path from 'path'
import { app } from 'electron'
import { ConfigStore } from './config/store'
import { setDriverRegistry } from './db/factory'
import type { DbAdapter } from './db/adapter'
import { DriverRegistryImpl } from './plugins/sdk/driver-registry'
import { CommandRegistryImpl } from './plugins/sdk/command-registry'
import { PanelRegistryImpl } from './plugins/sdk/panel-registry'
import { UIRegistryImpl } from './plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from './plugins/sdk/completion-registry'
import { KeyringService } from './keyring'
import { createAIModule } from './plugins/bundled/ai/internal'
import { SchemaAccessImpl } from './plugins/sdk/schema-access'
import { ConnectionAccessImpl } from './plugins/sdk/connection-access'
import { PluginBootCoordinator } from './plugins/plugin-host'
import * as sshPlugin from './plugins/bundled/ssh-tunnel'
import * as mongoPlugin from './plugins/bundled/mongodb'
import * as redisPlugin from './plugins/bundled/redis'
import * as snowflakePlugin from './plugins/bundled/snowflake'
import * as postgresqlPlugin from './plugins/bundled/postgresql'
import * as mysqlPlugin from './plugins/bundled/mysql'
import * as sqlitePlugin from './plugins/bundled/sqlite'
import * as aiPlugin from './plugins/bundled/ai'

import type { IpcContext } from './ipc/context'
import { handle } from './ipc/context'
import { registerConnectionHandlers } from './ipc/connections'
import { registerSettingsHandlers } from './ipc/settings'
import { registerKeyringHandlers } from './ipc/keyring'
import { registerDbHandlers } from './ipc/db'
import { registerExportImportHandlers } from './ipc/export-import'
import { registerDialogHandlers } from './ipc/dialog'
import { registerMigrationHandlers } from './ipc/migration'
import { registerMcpHandlers } from './ipc/mcp'
import { registerPluginHandlers } from './ipc/plugins'

export function registerIpcHandlers(): void {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  const ctx: IpcContext = {
    configStore: new ConfigStore(configPath),
    keyring: new KeyringService(),
    driverRegistry: new DriverRegistryImpl(),
    activeAdapters: new Map<string, DbAdapter>()
  }

  setDriverRegistry(ctx.driverRegistry)

  const commandRegistry = new CommandRegistryImpl()
  const panelRegistry = new PanelRegistryImpl()
  const uiRegistry = new UIRegistryImpl()
  const completionRegistry = new CompletionRegistryImpl()

  const schemaAccess = new SchemaAccessImpl((id) => ctx.activeAdapters.get(id))
  const connectionAccess = new ConnectionAccessImpl(
    (id) => ctx.activeAdapters.get(id),
    (id) => ctx.configStore.getConnection(id)
  )

  const settingsStore = {
    get: (key: string): unknown => ctx.configStore.getSetting(key),
    set: (key: string, value: unknown): void => ctx.configStore.setSetting(key, value)
  }

  registerConnectionHandlers(ctx, handle)
  registerSettingsHandlers(ctx, handle)
  registerKeyringHandlers(ctx, handle)
  registerDbHandlers(ctx, handle, connectionAccess)
  registerExportImportHandlers(ctx, handle)
  registerDialogHandlers(handle)
  registerMigrationHandlers(handle)

  const aiModule = createAIModule({
    keyring: ctx.keyring,
    schemaAccess,
    connectionAccess,
    handle,
    settingsStore
  })

  handle('ai:generate-sql', async (request) => aiModule.enhancements.generateSql(request))
  handle('ai:complete-sql', async (request) => aiModule.enhancements.completeSql(request))
  handle('ai:explain-results', async (request) => aiModule.enhancements.explainResults(request))

  registerMcpHandlers(ctx, handle, connectionAccess, settingsStore)

  const pluginCoordinator = new PluginBootCoordinator({
    driverRegistry: ctx.driverRegistry,
    commandRegistry,
    panelRegistry,
    uiRegistry,
    completionRegistry,
    getAdapter: (id) => ctx.activeAdapters.get(id),
    getProfile: (id) => ctx.configStore.getConnection(id),
    keyring: ctx.keyring,
    settingsStore,
    aiToolRegistry: aiModule.toolRegistry,
    aiProviderRegistry: aiModule.providerRegistry,
    aiConversationManager: aiModule.conversationManager
  })

  pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
  pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
  pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
  pluginCoordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
  pluginCoordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
  pluginCoordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
  pluginCoordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)

  pluginCoordinator.boot().catch(err => console.error('[plugins] Boot failed:', err))

  registerPluginHandlers(ctx, handle, {
    uiRegistry,
    completionRegistry,
    commandRegistry,
    pluginCoordinator
  })
}
