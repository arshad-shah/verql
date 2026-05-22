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
import { ServiceRegistryImpl } from './plugins/sdk/service-registry'
import { ExporterRegistryImpl } from './plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from './plugins/sdk/importer-registry'
import { TypeMapperRegistryImpl } from './plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from './plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from './plugins/sdk/drag-drop-registry'
import { BrowserWindow } from 'electron'
import { KeyringService } from './keyring'
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
import * as coreFormatsPlugin from './plugins/bundled/core-formats'
import * as coreThemesPlugin from './plugins/bundled/core-themes'

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
import { registerThemesHandlers } from './ipc/themes'
import { registerAppHandlers } from './ipc/app'
import { registerUpdaterHandlers } from './ipc/updater'
import { createUpdaterRegistry } from './updater'
import { getSecretFieldKeys, SECRET_PLACEHOLDER } from './ipc/secrets'

export function registerIpcHandlers(): void {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  // KeyringService must be created before ConfigStore so it can be passed in.
  const keyring = new KeyringService()
  const ctx: IpcContext = {
    configStore: new ConfigStore(configPath, keyring),
    keyring,
    driverRegistry: new DriverRegistryImpl(),
    activeAdapters: new Map<string, DbAdapter>()
  }

  setDriverRegistry(ctx.driverRegistry)

  const commandRegistry = new CommandRegistryImpl()
  const panelRegistry = new PanelRegistryImpl()
  const uiRegistry = new UIRegistryImpl()
  const completionRegistry = new CompletionRegistryImpl()
  const services = new ServiceRegistryImpl()
  const exporterRegistry = new ExporterRegistryImpl()
  const importerRegistry = new ImporterRegistryImpl()
  const typeMapperRegistry = new TypeMapperRegistryImpl()
  const themeRegistry = new ThemeRegistryImpl()
  const dragDropRegistry = new DragDropRegistryImpl()
  const notificationBus = {
    show(n: { kind?: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string; durationMs?: number }): void {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send('notifications:show', n)
      }
    }
  }

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
  registerExportImportHandlers(ctx, handle, { exporterRegistry, importerRegistry })
  // The migration IPC handler resolves type mappings through the registry,
  // so it needs visibility into what each driver plugin contributed.
  registerDialogHandlers(handle)
  registerMigrationHandlers(handle, typeMapperRegistry)
  registerAppHandlers(handle)
  registerUpdaterHandlers(handle, createUpdaterRegistry())

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
    services,
    exporterRegistry,
    importerRegistry,
    typeMapperRegistry,
    themeRegistry,
    notificationBus,
    dragDropRegistry,
    disabledPluginsStore: {
      isDisabled: (name) => {
        const list = ctx.configStore.getSetting('disabledPlugins') as string[] | undefined
        return Array.isArray(list) && list.includes(name)
      },
      markDisabled: (name) => {
        const current = (ctx.configStore.getSetting('disabledPlugins') as string[] | undefined) ?? []
        if (current.includes(name)) return
        ctx.configStore.setSetting('disabledPlugins', [...current, name])
      },
      markEnabled: (name) => {
        const current = (ctx.configStore.getSetting('disabledPlugins') as string[] | undefined) ?? []
        if (!current.includes(name)) return
        ctx.configStore.setSetting('disabledPlugins', current.filter(n => n !== name))
      }
    }
  })

  // The AI plugin is registered first so its `ai` service is available
  // synchronously when other plugins (mongo, redis) register their AI tools.
  pluginCoordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)
  // Core themes register before any window opens so the very first paint
  // already has the active theme's tokens — no flash of unstyled content.
  pluginCoordinator.registerBundledPlugin(coreThemesPlugin.manifest, coreThemesPlugin)
  // Core formats (CSV/JSON) before drivers so DB plugins can override defaults.
  pluginCoordinator.registerBundledPlugin(coreFormatsPlugin.manifest, coreFormatsPlugin)
  pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
  pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
  pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
  pluginCoordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
  pluginCoordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
  pluginCoordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)

  pluginCoordinator.boot()
    .then(() => {
      // One-time inline-secrets migration: pre-encryption builds wrote passwords
      // directly into config.json. Sweep them into the keyring so config.json
      // no longer holds any secrets. This is safe to run on every startup —
      // if the value is already in the keyring and blanked on disk, the profile
      // loaded into memory via injectSecretsFromKeyring will have an empty string
      // for the field (already migrated), so `hasInline` will be false and we skip.
      const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
      for (const profile of ctx.configStore.listConnections()) {
        const hasInline = [...secretKeys].some(k => {
          const v = (profile as unknown as Record<string, unknown>)[k]
          return typeof v === 'string' && v.length > 0 && v !== SECRET_PLACEHOLDER
        })
        if (!hasInline) continue
        ctx.configStore.saveConnection(profile, secretKeys)
      }
    })
    .catch(err => console.error('[plugins] Boot failed:', err))

  registerPluginHandlers(ctx, handle, {
    uiRegistry,
    completionRegistry,
    commandRegistry,
    pluginCoordinator
  })

  registerThemesHandlers(handle, { themeRegistry })

  // Broadcast `themes:changed` whenever the registry mutates (plugin
  // activation / deactivation) so the renderer can refetch + reinject.
  themeRegistry.onChange(() => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send('themes:changed')
    }
  })

  handle('plugins:drag-drop', async (filePath) => {
    const ext = filePath.split('.').pop() ?? ''
    const provider = dragDropRegistry.resolveByExtension(ext)
    if (!provider) return { handled: false }
    const name = filePath.split(/[\\/]/).pop() ?? filePath
    try {
      await provider.onDrop({ filePath, fileName: name, extension: ext.toLowerCase() })
      return { handled: true }
    } catch (err) {
      console.error('[plugins] drag-drop handler failed:', err)
      return { handled: false }
    }
  })
}
