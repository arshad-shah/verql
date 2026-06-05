// Regression: an isolated plugin that activates but whose contributions fail
// verification (registered nothing the manifest declared) left its worker
// process and host-side handle alive forever. `shutdown()` only iterates
// `activationOrder`, which an error-state plugin is never added to, so the
// forked utilityProcess leaked for the app's lifetime — a hostile plugin
// could fail verification on purpose to keep a live RPC bridge around.
//
// The coordinator now tears the worker down (deactivate + clear handle) when
// verification doesn't yield an active/degraded plugin.
import { describe, it, expect, vi } from 'vitest'
import os from 'os'
import path from 'path'

const USER_DATA = path.join(os.tmpdir(), 'verql-verify-teardown-userdata')
vi.mock('electron', () => ({
  app: { getPath: () => USER_DATA },
  ipcMain: { handle: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import { createMemoryTransportPair } from '../../../src/main/plugins/isolation/memory-transport'
import { startWorker } from '../../../src/main/plugins/isolation/worker-runtime'
import { PluginBootCoordinator } from '../../../src/main/plugins/plugin-host'
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

// Worker plugin that registers a command with a DIFFERENT id than the manifest
// declares, so verifyContributions reports the declared command as missing →
// registered.length === 0 → error state.
const mismatchedPlugin = {
  activate(ctx: { commands: { register: (id: string, h: () => unknown) => unknown } }) {
    ctx.commands.register('something-else', () => {})
  },
}

function buildCoordinator(closes: { closed: boolean }) {
  const { host, worker } = createMemoryTransportPair()
  startWorker(worker, { requireModule: () => mismatchedPlugin, installSandbox: () => () => {} })
  const origClose = host.close.bind(host)
  host.close = () => { closes.closed = true; origClose() }

  const coordinator = new PluginBootCoordinator({
    driverRegistry: new DriverRegistryImpl(),
    commandRegistry: new CommandRegistryImpl(),
    panelRegistry: new PanelRegistryImpl(),
    uiRegistry: new UIRegistryImpl(),
    completionRegistry: new CompletionRegistryImpl(),
    getAdapter: () => undefined,
    getProfile: () => undefined,
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
    spawnWorkerTransport: () => host,
  })
  return coordinator
}

function isolatedPlugin(): LoadedPlugin {
  return {
    manifest: {
      name: 'iso', version: '1.0.0', displayName: 'Iso', description: 'x', main: 'index.js',
      contributes: { commands: [{ id: 'declared-cmd', title: 'Declared' }] },
    } as LoadedPlugin['manifest'],
    path: '/fake/iso',
    mainPath: '/fake/iso/index.js',
    runIsolated: true,
    status: { state: 'resolved' } as LoadedPlugin['status'],
  }
}

describe('activateIsolated — teardown on verification failure', () => {
  it('deactivates the worker and clears the handle when verification fails', async () => {
    const closes = { closed: false }
    const coordinator = buildCoordinator(closes)
    const plugin = isolatedPlugin()

    await coordinator.activatePlugin(plugin)

    expect(plugin.status.state).toBe('error')
    // The leaked-worker bug: handle stayed set and the transport stayed open.
    expect(plugin.isolatedHandle).toBeUndefined()
    expect(plugin.context).toBeUndefined()
    expect(closes.closed).toBe(true)
  })
})
