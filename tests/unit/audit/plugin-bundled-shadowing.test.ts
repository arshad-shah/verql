// Regression test: a discovered (third-party) plugin can never overwrite the
// entry for an already-registered bundled plugin.
//
// Before the fix, `discover()` did `this.plugins.set(manifest.name, …)` with no
// check, so a user-installed plugin claiming the name `verql-plugin-postgresql`
// would silently shadow the built-in postgres driver — and then run *its*
// activate(), getting first crack at every postgres connection (and the
// credentials passed through them).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => path.join(os.tmpdir(), 'verql-plugin-shadowing-test') }
}))

import { PluginBootCoordinator } from '../../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../../src/main/plugins/sdk/completion-registry'
import { ServiceRegistryImpl } from '../../../src/main/plugins/sdk/service-registry'
import { ExporterRegistryImpl } from '../../../src/main/plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from '../../../src/main/plugins/sdk/importer-registry'
import { TypeMapperRegistryImpl } from '../../../src/main/plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from '../../../src/main/plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from '../../../src/main/plugins/sdk/drag-drop-registry'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {},
  listKeys: async () => [],
}

function makeCoordinator(): PluginBootCoordinator {
  return new PluginBootCoordinator({
    driverRegistry: new DriverRegistryImpl(),
    commandRegistry: new CommandRegistryImpl(),
    panelRegistry: new PanelRegistryImpl(),
    uiRegistry: new UIRegistryImpl(),
    completionRegistry: new CompletionRegistryImpl(),
    getAdapter: () => undefined,
    getProfile: () => undefined,
    keyring: noopKeyring,
    settingsStore: { get: () => undefined, set: () => {} },
    services: new ServiceRegistryImpl(),
    exporterRegistry: new ExporterRegistryImpl(),
    importerRegistry: new ImporterRegistryImpl(),
    typeMapperRegistry: new TypeMapperRegistryImpl(),
    themeRegistry: new ThemeRegistryImpl(),
    notificationBus: { show: () => {} },
    dragDropRegistry: new DragDropRegistryImpl(),
  })
}

describe('PluginBootCoordinator — bundled plugins cannot be shadowed', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verql-shadow-'))
  })

  it('discover() refuses to overwrite a bundled plugin entry', () => {
    const coordinator = makeCoordinator()
    const bundledModule = { activate: () => {} }
    coordinator.registerBundledPlugin(
      {
        name: 'verql-plugin-postgresql',
        version: '1.0.0',
        displayName: 'Postgres (bundled)',
        description: 'bundled',
        main: 'index.js',
        contributes: {},
      },
      bundledModule,
    )

    // Drop a malicious plugin folder onto disk that claims the same name.
    const evilDir = path.join(tmpDir, 'evil')
    fs.mkdirSync(evilDir, { recursive: true })
    fs.writeFileSync(
      path.join(evilDir, 'plugin-manifest.json'),
      JSON.stringify({
        name: 'verql-plugin-postgresql',
        version: '9.9.9',
        displayName: 'EVIL Postgres',
        description: 'pwn',
        main: 'index.js',
        contributes: {},
      }),
    )
    fs.writeFileSync(path.join(evilDir, 'index.js'), 'module.exports = { activate(){} }')

    coordinator.discover([tmpDir])

    const plugin = coordinator.getPlugin('verql-plugin-postgresql')
    expect(plugin).toBeDefined()
    expect(plugin!.path).toBe('<bundled>')
    expect(plugin!.manifest.displayName).toBe('Postgres (bundled)')
  })
})
