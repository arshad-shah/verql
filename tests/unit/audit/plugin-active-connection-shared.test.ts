// Regression: every plugin context shared a *fresh* ConnectionAccessImpl,
// but only the one wired into db:connect/db:disconnect ever had
// setActiveConnectionId() called. So for every plugin (including the AI
// assistant), ctx.connections.getActiveConnectionId() was permanently null
// and onActiveConnectionChanged never fired — silently breaking any plugin
// that acts on "the current connection".
//
// The coordinator now shares the single host-wide ConnectionAccessImpl
// across all plugin contexts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import os from 'os'
import path from 'path'

const USER_DATA = path.join(os.tmpdir(), 'verql-active-conn-test-userdata')
vi.mock('electron', () => ({ app: { getPath: () => USER_DATA } }))

import { PluginBootCoordinator } from '../../../src/main/plugins/plugin-host'
import { ConnectionAccessImpl } from '../../../src/main/plugins/sdk/connection-access'
import { DriverRegistryImpl } from '../../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../../src/main/plugins/sdk/completion-registry'
import { ServiceRegistryImpl } from '../../../src/main/plugins/sdk/service-registry'
import { ExporterRegistryImpl } from '../../../src/main/plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from '../../../src/main/plugins/sdk/importer-registry'
import { FormatterRegistryImpl } from '../../../src/main/plugins/sdk/formatter-registry'
import { TypeMapperRegistryImpl } from '../../../src/main/plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from '../../../src/main/plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from '../../../src/main/plugins/sdk/drag-drop-registry'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'
import type { LoadedPlugin } from '../../../src/main/plugins/types'
import type { PluginContext } from '../../../src/main/plugins/sdk/types'

let sharedConn: ConnectionAccessImpl

function buildCoordinator(): PluginBootCoordinator {
  sharedConn = new ConnectionAccessImpl(() => undefined, () => undefined)
  return new PluginBootCoordinator({
    driverRegistry: new DriverRegistryImpl(),
    commandRegistry: new CommandRegistryImpl(),
    panelRegistry: new PanelRegistryImpl(),
    uiRegistry: new UIRegistryImpl(),
    completionRegistry: new CompletionRegistryImpl(),
    getAdapter: () => undefined,
    getProfile: () => undefined,
    connectionAccess: sharedConn,
    keyring: { store: async () => {}, retrieve: async () => null, delete: async () => {}, listKeys: async () => [] } as never,
    settingsStore: { get: () => undefined, set: () => {} },
    services: new ServiceRegistryImpl(),
    exporterRegistry: new ExporterRegistryImpl(),
    importerRegistry: new ImporterRegistryImpl(),
    formatterRegistry: new FormatterRegistryImpl(),
    typeMapperRegistry: new TypeMapperRegistryImpl(),
    themeRegistry: new ThemeRegistryImpl(),
    notificationBus: { show: () => {} },
    dragDropRegistry: new DragDropRegistryImpl(),
    toolRegistry: new ToolRegistryImpl(),
  })
}

function makeBundledPlugin(name: string, onActivate: (ctx: PluginContext) => void): LoadedPlugin {
  return {
    manifest: {
      name, version: '1.0.0', displayName: name, description: 'x', main: 'index.js',
      contributes: { commands: [{ id: 'noop', title: 'noop' }] },
    } as LoadedPlugin['manifest'],
    path: '<bundled>', // trusted → all capabilities granted
    status: { state: 'resolved' } as LoadedPlugin['status'],
    module: {
      activate: (ctx) => {
        // register the declared command so verification passes
        ctx.commands.register('noop', () => {})
        onActivate(ctx)
      },
    },
  }
}

beforeEach(() => { /* fresh coordinator per test */ })
afterEach(() => { vi.restoreAllMocks() })

describe('plugin context — shared active-connection access', () => {
  it('reflects setActiveConnectionId set after activation', async () => {
    const coordinator = buildCoordinator()
    let captured: PluginContext | undefined
    const plugin = makeBundledPlugin('p-conn', (ctx) => { captured = ctx })

    await coordinator.activatePlugin(plugin)
    expect(captured).toBeDefined()

    // Before any connect, no active connection.
    expect(captured!.connections.getActiveConnectionId()).toBeNull()

    // Simulate db:connect updating the shared instance.
    sharedConn.setActiveConnectionId('conn-42')
    expect(captured!.connections.getActiveConnectionId()).toBe('conn-42')

    sharedConn.setActiveConnectionId(null)
    expect(captured!.connections.getActiveConnectionId()).toBeNull()
  })

  it('delivers onActiveConnectionChanged events to the plugin', async () => {
    const coordinator = buildCoordinator()
    let captured: PluginContext | undefined
    await coordinator.activatePlugin(makeBundledPlugin('p-conn-2', (ctx) => { captured = ctx }))

    const seen: Array<string | null> = []
    captured!.connections.onActiveConnectionChanged((id) => seen.push(id))

    sharedConn.setActiveConnectionId('a')
    sharedConn.setActiveConnectionId('b')
    expect(seen).toEqual(['a', 'b'])
  })

  it('all plugins observe the same active connection', async () => {
    const coordinator = buildCoordinator()
    let c1: PluginContext | undefined
    let c2: PluginContext | undefined
    await coordinator.activatePlugin(makeBundledPlugin('p-a', (ctx) => { c1 = ctx }))
    await coordinator.activatePlugin(makeBundledPlugin('p-b', (ctx) => { c2 = ctx }))

    sharedConn.setActiveConnectionId('shared-conn')
    expect(c1!.connections.getActiveConnectionId()).toBe('shared-conn')
    expect(c2!.connections.getActiveConnectionId()).toBe('shared-conn')
  })
})
