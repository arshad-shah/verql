import path from 'path'
import { app } from 'electron'
import { ConfigStore } from './config/store'
import { setDriverRegistry } from './db/factory'
import type { DbAdapter } from './db/adapter'
import { DriverRegistryImpl } from './plugins/sdk/driver-registry'
import { CommandRegistryImpl } from './plugins/sdk/command-registry'
import { ToolRegistryImpl } from './plugins/sdk/tool-registry'
import { PanelRegistryImpl } from './plugins/sdk/panel-registry'
import { UIRegistryImpl } from './plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from './plugins/sdk/completion-registry'
import { ServiceRegistryImpl } from './plugins/sdk/service-registry'
import { ExporterRegistryImpl } from './plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from './plugins/sdk/importer-registry'
import { FormatterRegistryImpl } from './plugins/sdk/formatter-registry'
import { IPC_CHANNELS } from '@shared/ipc'
import { TypeMapperRegistryImpl } from './plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from './plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from './plugins/sdk/drag-drop-registry'
import { BrowserWindow } from 'electron'
import { KeyringService } from './keyring'
import { ConnectionAccessImpl } from './plugins/sdk/connection-access'
import { PluginBootCoordinator } from './plugins/plugin-host'
import type { PluginPermission } from './plugins/sdk/permissions'
// Single import that lists every bundled plugin. The orchestrator never
// names individual drivers — that list lives in src/main/plugins/bundled/
// where it belongs. Adding a driver does not change this file.
import { bundledPlugins } from './plugins/bundled'

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

  // Tear down database adapters (and any SSH tunnels they're using through
  // connection middleware) before the process exits. Without this, the OS
  // reclaims the sockets eventually, but background pools can hold the
  // event loop open just long enough to delay quit, and SSH child
  // processes don't always get the SIGTERM they need.
  let shuttingDown = false
  app.on('before-quit', (event) => {
    if (shuttingDown || ctx.activeAdapters.size === 0) return
    shuttingDown = true
    event.preventDefault()
    Promise.allSettled(
      Array.from(ctx.activeAdapters.values()).map(a => a.disconnect()),
    ).finally(() => {
      ctx.activeAdapters.clear()
      app.quit()
    })
  })

  setDriverRegistry(ctx.driverRegistry)

  const commandRegistry = new CommandRegistryImpl()
  // Shared across the plugin host (ctx.tools) and the MCP server so tools
  // registered by the db-tools plugin are exposed to both consumers.
  const toolRegistry = new ToolRegistryImpl()
  const panelRegistry = new PanelRegistryImpl()
  const uiRegistry = new UIRegistryImpl()
  const completionRegistry = new CompletionRegistryImpl()
  const services = new ServiceRegistryImpl()
  const exporterRegistry = new ExporterRegistryImpl()
  const importerRegistry = new ImporterRegistryImpl()
  const formatterRegistry = new FormatterRegistryImpl()
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

  // Query formatting is plugin-owned: each driver contributes a formatter for
  // its editor language (SQL drivers a dialect one, core-formats a generic SQL
  // fallback, MongoDB a JSON one, …). This handler is pure glue — resolve by
  // (language, connection type) and run it. Returns the input unchanged when no
  // formatter matches or the source can't be parsed, so the buffer is safe.
  handle(IPC_CHANNELS.DB_FORMAT_QUERY, async (language, connectionType, source) => {
    const formatter = formatterRegistry.resolve(language, connectionType)
    if (!formatter) return { formatted: source, changed: false }
    const formatted = await formatter.format(source)
    return { formatted, changed: formatted !== source }
  })
  // The migration IPC handler resolves type mappings through the registry,
  // so it needs visibility into what each driver plugin contributed.
  registerDialogHandlers(handle)
  registerMigrationHandlers(handle, typeMapperRegistry, ctx.driverRegistry)
  registerAppHandlers(handle)
  registerUpdaterHandlers(handle, createUpdaterRegistry())

  const mcpServer = registerMcpHandlers(ctx, handle, connectionAccess, settingsStore, toolRegistry)

  const pluginCoordinator = new PluginBootCoordinator({
    driverRegistry: ctx.driverRegistry,
    commandRegistry,
    toolRegistry,
    panelRegistry,
    uiRegistry,
    completionRegistry,
    getAdapter: (id) => ctx.activeAdapters.get(id),
    getProfile: (id) => ctx.configStore.getConnection(id),
    // Share the same instance db:connect/db:disconnect update so plugins'
    // ctx.connections.getActiveConnectionId() reflects the active connection.
    connectionAccess,
    keyring: ctx.keyring,
    settingsStore,
    services,
    exporterRegistry,
    importerRegistry,
    formatterRegistry,
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
    },
    pluginGrantsStore: {
      getGrants: (name) => {
        const map = ctx.configStore.getSetting('pluginGrants') as Record<string, string[]> | undefined
        const list = map?.[name]
        return Array.isArray(list) ? (list as PluginPermission[]) : []
      },
      setGrants: (name, permissions) => {
        const map = { ...((ctx.configStore.getSetting('pluginGrants') as Record<string, string[]> | undefined) ?? {}) }
        if (permissions.length === 0) delete map[name]
        else map[name] = permissions
        ctx.configStore.setSetting('pluginGrants', map)
      }
    }
  })

  // Register every bundled plugin in the order declared by the bundled
  // entry-point. AI registers first because other plugins depend on its
  // service; core-themes before the first paint to avoid flash of unstyled
  // content; core-formats before drivers so drivers can override defaults.
  for (const plugin of bundledPlugins) {
    pluginCoordinator.registerBundledPlugin(plugin.manifest, plugin)
  }

  pluginCoordinator.boot()
    .then(() => {
      // Auto-start the MCP server only after plugin boot completes, so the
      // db-tools bundled plugin has registered its tools into the shared
      // registry. Starting earlier (at handler-registration time) would expose
      // an empty tool set.
      if (ctx.configStore.getSetting('mcp.enabled') as boolean) {
        mcpServer.start().catch(err => console.error('[mcp] Auto-start failed:', err))
      }
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
