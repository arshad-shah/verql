// Plugin loading must refuse a `main` entry that resolves OUTSIDE the plugin
// directory. The old code did `require(path.join(pluginPath, manifest.main))`
// which happily traversed up out of the sandbox when `main` contained `..`.
// A malicious manifest could point at /etc/whatever.js, /tmp, or the user's
// home — anything Node would `require()`. We pin the constraint: validate
// rejects any `main` that escapes the plugin folder.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => path.join(os.tmpdir(), 'verql-traversal-test') },
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

function buildCoordinator(): PluginBootCoordinator {
  return new PluginBootCoordinator({
    driverRegistry: new DriverRegistryImpl(),
    commandRegistry: new CommandRegistryImpl(),
    panelRegistry: new PanelRegistryImpl(),
    uiRegistry: new UIRegistryImpl(),
    completionRegistry: new CompletionRegistryImpl(),
    getAdapter: () => undefined,
    getProfile: () => undefined,
    keyring: { store: async () => {}, retrieve: async () => null, delete: async () => {}, listKeys: async () => [] },
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

describe('plugin loading — main entry cannot escape the plugin directory', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verql-traversal-'))
  })

  it('rejects a manifest whose main contains `..`', () => {
    const evil = path.join(tmpDir, 'evil')
    fs.mkdirSync(evil, { recursive: true })
    fs.writeFileSync(
      path.join(evil, 'plugin-manifest.json'),
      JSON.stringify({
        name: 'evil-plugin',
        version: '1.0.0',
        displayName: 'Evil',
        description: 'pwn',
        main: '../../../etc/passwd.js',
        contributes: {},
      }),
    )
    // Plant a real .js file at the escape target so a buggy implementation
    // would actually load it. (`require` only complains if the file is
    // missing.)
    const escape = path.resolve(tmpDir, '..', '..', '..', 'etc', 'passwd.js')
    // Keep the test side-effect-free — don't write outside tmpDir. We rely
    // on validate() rejecting the manifest BEFORE require() runs.
    void escape

    const coordinator = buildCoordinator()
    coordinator.discover([tmpDir])
    coordinator.validateAll()

    const plugin = coordinator.getPlugin('evil-plugin')
    expect(plugin?.status.state).toBe('error')
    if (plugin?.status.state === 'error') {
      expect(plugin.status.error).toMatch(/outside the plugin directory|invalid main/i)
    }
  })

  it('rejects a manifest whose main starts with /', () => {
    const evil = path.join(tmpDir, 'absolute-main')
    fs.mkdirSync(evil, { recursive: true })
    fs.writeFileSync(
      path.join(evil, 'plugin-manifest.json'),
      JSON.stringify({
        name: 'absolute-main',
        version: '1.0.0',
        displayName: 'Absolute',
        description: 'evil',
        main: '/etc/passwd.js',
        contributes: {},
      }),
    )

    const coordinator = buildCoordinator()
    coordinator.discover([tmpDir])
    coordinator.validateAll()

    const plugin = coordinator.getPlugin('absolute-main')
    expect(plugin?.status.state).toBe('error')
  })

  it('accepts a nested subdirectory main like dist/index.js', () => {
    const ok = path.join(tmpDir, 'ok-plugin')
    fs.mkdirSync(path.join(ok, 'dist'), { recursive: true })
    fs.writeFileSync(
      path.join(ok, 'plugin-manifest.json'),
      JSON.stringify({
        name: 'ok-plugin',
        version: '1.0.0',
        displayName: 'OK',
        description: 'ok',
        main: 'dist/index.js',
        contributes: {},
      }),
    )
    fs.writeFileSync(path.join(ok, 'dist', 'index.js'), 'module.exports = { activate() {} }')

    const coordinator = buildCoordinator()
    coordinator.discover([tmpDir])
    coordinator.validateAll()

    const plugin = coordinator.getPlugin('ok-plugin')
    expect(plugin?.status.state).toBe('validated')
  })
})
