// src/main/plugins/sdk/index.ts
import type { PluginContext, Disposable } from './types'
import { DriverRegistryImpl } from './driver-registry'
import { CommandRegistryImpl } from './command-registry'
import { PanelRegistryImpl } from './panel-registry'
import { UIRegistryImpl } from './ui-registry'
import { SchemaAccessImpl } from './schema-access'
import { ConnectionAccessImpl } from './connection-access'
import { PluginSettingsImpl } from './settings'

export { DriverRegistryImpl } from './driver-registry'
export { CommandRegistryImpl } from './command-registry'
export { PanelRegistryImpl } from './panel-registry'
export { UIRegistryImpl } from './ui-registry'
export { SchemaAccessImpl } from './schema-access'
export { ConnectionAccessImpl } from './connection-access'
export { PluginSettingsImpl } from './settings'
export { safeCall, ErrorBudget, PluginError } from './safe-call'
export type * from './types'

interface ContextDeps {
  pluginName: string
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  uiRegistry: UIRegistryImpl
  schemaAccess: SchemaAccessImpl
  connectionAccess: ConnectionAccessImpl
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
  keyring: import('./types').KeyringAccess
}

export function createPluginContext(deps: ContextDeps): PluginContext {
  const subscriptions: Disposable[] = []
  const { pluginName } = deps

  // Create scoped wrappers that auto-track subscriptions
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
    registerTab(id: string, widgets: Parameters<UIRegistryImpl['registerTab']>[1]) {
      const disposable = deps.uiRegistry.registerTab(id, widgets)
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

  const settings = new PluginSettingsImpl(pluginName, deps.settingsStore)

  return {
    drivers,
    commands,
    panels,
    ui,
    schema: deps.schemaAccess,
    connections: deps.connectionAccess,
    settings,
    keyring: deps.keyring,
    subscriptions
  }
}

export function disposePluginContext(context: PluginContext): void {
  // Dispose in reverse order
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
