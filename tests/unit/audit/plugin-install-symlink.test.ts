// Installing a plugin copies its folder into the trusted plugin directory.
// A symlink anywhere in that folder is an escape vector: fs.cpSync would copy
// the link verbatim, and a later read would follow it out of the sandbox
// (e.g. a link to ~/.ssh, the keychain dir, or /etc). Plugins are plain files;
// a symlink is never legitimate, so installFromPath must refuse it. This also
// guards installFromZip, which funnels through installFromPath.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const USER_DATA = path.join(os.tmpdir(), 'verql-symlink-test-userdata')
vi.mock('electron', () => ({
  app: { getPath: () => USER_DATA },
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
import { FormatterRegistryImpl } from '../../../src/main/plugins/sdk/formatter-registry'
import { TypeMapperRegistryImpl } from '../../../src/main/plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from '../../../src/main/plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from '../../../src/main/plugins/sdk/drag-drop-registry'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'

function buildCoordinator(): PluginBootCoordinator {
  return new PluginBootCoordinator({
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
  })
}

function writeManifest(dir: string, name: string): void {
  fs.writeFileSync(
    path.join(dir, 'plugin-manifest.json'),
    JSON.stringify({ name, version: '1.0.0', displayName: name, description: 'x', main: 'index.js', contributes: {} }),
  )
  fs.writeFileSync(path.join(dir, 'index.js'), 'exports.activate = () => {}')
}

describe('installFromPath — symlink rejection', () => {
  let src: string

  beforeEach(() => {
    src = fs.mkdtempSync(path.join(os.tmpdir(), 'verql-plugin-src-'))
  })
  afterEach(() => {
    fs.rmSync(src, { recursive: true, force: true })
    fs.rmSync(USER_DATA, { recursive: true, force: true })
  })

  it('refuses a plugin folder containing a symlink', () => {
    writeManifest(src, 'symlink-plugin')
    fs.symlinkSync('/etc/passwd', path.join(src, 'secrets.txt'))

    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/symlink/i)
    // Nothing should have been copied into the plugin dir.
    expect(fs.existsSync(path.join(USER_DATA, 'plugins', 'symlink-plugin'))).toBe(false)
  })

  it('installs a clean plugin folder with no symlinks', () => {
    writeManifest(src, 'clean-plugin')
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(true)
    expect(result.name).toBe('clean-plugin')
    expect(fs.existsSync(path.join(USER_DATA, 'plugins', 'clean-plugin', 'index.js'))).toBe(true)
  })

  it('rejects an invalid plugin name before copying', () => {
    writeManifest(src, 'clean-plugin')
    // Overwrite the manifest name with a traversal attempt.
    fs.writeFileSync(
      path.join(src, 'plugin-manifest.json'),
      JSON.stringify({ name: '../escape', version: '1.0.0', displayName: 'x', description: 'x', main: 'index.js', contributes: {} }),
    )
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid plugin name/i)
  })
})
