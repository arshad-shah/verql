// src/main/plugins/sdk/index.ts
import { ipcMain, BrowserWindow } from 'electron'
import type { PluginContext, Disposable, PluginIpc, BroadcastFn } from './types'
import { DriverRegistryImpl } from './driver-registry'
import { CommandRegistryImpl } from './command-registry'
import { PanelRegistryImpl } from './panel-registry'
import { UIRegistryImpl } from './ui-registry'
import { CompletionRegistryImpl } from './completion-registry'
import { SchemaAccessImpl } from './schema-access'
import { ConnectionAccessImpl } from './connection-access'
import { PluginSettingsImpl } from './settings'
import { ServiceRegistryImpl, type ServiceRegistry } from './service-registry'
import { createAIAccess } from './ai-access'
import { ExporterRegistryImpl, type ExporterRegistry } from './exporter-registry'
import { ImporterRegistryImpl, type ImporterRegistry } from './importer-registry'

export { DriverRegistryImpl } from './driver-registry'
export { CommandRegistryImpl } from './command-registry'
export { PanelRegistryImpl } from './panel-registry'
export { UIRegistryImpl } from './ui-registry'
export { CompletionRegistryImpl } from './completion-registry'
export { SchemaAccessImpl } from './schema-access'
export { ConnectionAccessImpl } from './connection-access'
export { PluginSettingsImpl } from './settings'
export { ServiceRegistryImpl } from './service-registry'
export { ExporterRegistryImpl } from './exporter-registry'
export { ImporterRegistryImpl } from './importer-registry'
export { safeCall, ErrorBudget, PluginError } from './safe-call'
export type * from './types'
export type { RegisteredExporter, ExporterFn, ExporterOptions } from './exporter-registry'
export type { RegisteredImporter, ImporterParseFn, ImporterOptions, ImporterResult } from './importer-registry'

interface ContextDeps {
  pluginName: string
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  uiRegistry: UIRegistryImpl
  completionRegistry: CompletionRegistryImpl
  schemaAccess: SchemaAccessImpl
  connectionAccess: ConnectionAccessImpl
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
  keyring: import('./types').KeyringAccess
  services: ServiceRegistry
  exporterRegistry: ExporterRegistry
  importerRegistry: ImporterRegistry
}

export function createPluginContext(deps: ContextDeps): PluginContext {
  const subscriptions: Disposable[] = []
  const { pluginName } = deps

  const drivers = {
    register(id: string, factory: Parameters<DriverRegistryImpl['register']>[1]) {
      const disposable = deps.driverRegistry.register(id, factory)
      subscriptions.push(disposable)
      return disposable
    },
    registerConnectionMiddleware(id: string, middleware: Parameters<DriverRegistryImpl['registerConnectionMiddleware']>[1]) {
      const disposable = deps.driverRegistry.registerConnectionMiddleware(id, middleware, pluginName)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const commands = {
    register(id: string, handler: () => void | Promise<void>) {
      const namespacedId = `${pluginName}:${id}`
      const disposable = deps.commandRegistry.register(namespacedId, handler)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const panels = {
    register(id: string, panel: Parameters<PanelRegistryImpl['register']>[1]) {
      const disposable = deps.panelRegistry.register(id, panel)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const ui = {
    registerPanel(id: string, widgets: Parameters<UIRegistryImpl['registerPanel']>[1]) {
      const disposable = deps.uiRegistry.registerPanel(id, widgets)
      subscriptions.push(disposable)
      return disposable
    },
    registerStatusBar(id: string, widgets: Parameters<UIRegistryImpl['registerStatusBar']>[1]) {
      const disposable = deps.uiRegistry.registerStatusBar(id, widgets)
      subscriptions.push(disposable)
      return disposable
    },
    registerToolbar(id: string, widgets: Parameters<UIRegistryImpl['registerToolbar']>[1]) {
      const disposable = deps.uiRegistry.registerToolbar(id, widgets)
      subscriptions.push(disposable)
      return disposable
    },
    registerTab(id: string, widgets: Parameters<UIRegistryImpl['registerTab']>[1]) {
      const disposable = deps.uiRegistry.registerTab(id, widgets)
      subscriptions.push(disposable)
      return disposable
    },
    registerSlot(slotId: string, widgets: Parameters<UIRegistryImpl['registerSlot']>[1]) {
      const disposable = deps.uiRegistry.registerSlot(slotId, widgets)
      subscriptions.push(disposable)
      return disposable
    },
    registerResolver(id: string, resolver: Parameters<UIRegistryImpl['registerResolver']>[1]) {
      const disposable = deps.uiRegistry.registerResolver(id, resolver)
      subscriptions.push(disposable)
      return disposable
    },
    invalidate(resolverId: string) {
      deps.uiRegistry.invalidate(resolverId)
    }
  }

  const completions = {
    register(provider: Parameters<CompletionRegistryImpl['register']>[0]) {
      const disposable = deps.completionRegistry.register(provider)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const settings = new PluginSettingsImpl(pluginName, deps.settingsStore)

  // Service-registry-backed AI proxy. Tracks its own disposables under the
  // plugin's subscriptions so they're cleaned up on deactivation.
  const aiAccess = createAIAccess(deps.services)
  const ai = {
    registerTool(tool: Parameters<typeof aiAccess.registerTool>[0]) {
      const d = aiAccess.registerTool(tool)
      subscriptions.push(d)
      return d
    },
    registerProvider(provider: Parameters<typeof aiAccess.registerProvider>[0]) {
      const d = aiAccess.registerProvider(provider)
      subscriptions.push(d)
      return d
    },
    registerContextProvider(provider: Parameters<typeof aiAccess.registerContextProvider>[0]) {
      const d = aiAccess.registerContextProvider(provider)
      subscriptions.push(d)
      return d
    }
  }

  const ipc: PluginIpc = {
    handle(channel, handler) {
      ipcMain.handle(channel, (_event, ...args) =>
        (handler as (...a: unknown[]) => unknown)(...args)
      )
      const disposable: Disposable = { dispose: () => ipcMain.removeHandler(channel as string) }
      subscriptions.push(disposable)
      return disposable
    }
  }

  const broadcast: BroadcastFn = (channel, ...args) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(channel, ...args)
    }
  }

  // The plugin's `services` is a *scoped* view of the global registry — provides
  // are tracked as plugin subscriptions so disposing the context unprovisions them.
  const services = {
    provide<T>(serviceId: string, impl: T) {
      const d = deps.services.provide(serviceId, impl)
      subscriptions.push(d)
      return d
    },
    consume<T>(serviceId: string) {
      return deps.services.consume<T>(serviceId)
    },
    onAvailable<T>(serviceId: string, cb: (impl: T) => void) {
      const d = deps.services.onAvailable(serviceId, cb)
      subscriptions.push(d)
      return d
    }
  }

  const exporters = {
    register(id: string, exporter: Parameters<ExporterRegistry['register']>[1]) {
      const d = deps.exporterRegistry.register(`${pluginName}:${id}`, exporter)
      subscriptions.push(d)
      return d
    }
  }

  const importers = {
    register(id: string, importer: Parameters<ImporterRegistry['register']>[1]) {
      const d = deps.importerRegistry.register(`${pluginName}:${id}`, importer)
      subscriptions.push(d)
      return d
    }
  }

  return {
    drivers,
    commands,
    panels,
    ui,
    completions,
    schema: deps.schemaAccess,
    connections: deps.connectionAccess,
    settings,
    keyring: deps.keyring,
    ai,
    ipc,
    broadcast,
    services,
    exporters,
    importers,
    rootSettings: deps.settingsStore,
    subscriptions
  }
}

export function disposePluginContext(context: PluginContext): void {
  const subs = [...context.subscriptions].reverse()
  for (const sub of subs) {
    try {
      sub.dispose()
    } catch {
      // Ignore disposal errors
    }
  }
  context.subscriptions.length = 0
}
