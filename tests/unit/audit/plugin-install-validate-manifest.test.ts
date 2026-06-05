// Security regression: installFromPath must fully validate the manifest BEFORE
// copying the package into the trusted plugin directory. Previously it checked
// only the name pattern, so a package with a bad version / unknown permission /
// non-.js main / missing required field was written to userData/plugins first
// and only rejected later at validateAll() — persisting junk in the trusted
// folder and reporting a misleading success.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const USER_DATA = path.join(os.tmpdir(), 'verql-install-validate-userdata')
vi.mock('electron', () => ({ app: { getPath: () => USER_DATA } }))

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

let src: string
function writeSource(manifest: Record<string, unknown>): void {
  fs.writeFileSync(path.join(src, 'plugin-manifest.json'), JSON.stringify(manifest))
  fs.writeFileSync(path.join(src, 'index.js'), 'exports.activate = () => {}')
}
function installedDir(name: string): string {
  return path.join(USER_DATA, 'plugins', name)
}

beforeEach(() => { src = fs.mkdtempSync(path.join(os.tmpdir(), 'verql-install-src-')) })
afterEach(() => {
  fs.rmSync(src, { recursive: true, force: true })
  fs.rmSync(USER_DATA, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('installFromPath — manifest validation before copy', () => {
  it('rejects an unknown permission without copying into the trusted dir', () => {
    writeSource({
      name: 'bad-perms', version: '1.0.0', displayName: 'x', description: 'x',
      main: 'index.js', permissions: ['not-a-real-permission'], contributes: {},
    })
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/permission/i)
    expect(fs.existsSync(installedDir('bad-perms'))).toBe(false)
  })

  it('rejects a non-.js main before copying', () => {
    writeSource({
      name: 'bad-main', version: '1.0.0', displayName: 'x', description: 'x',
      main: 'index.ts', contributes: {},
    })
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/main/i)
    expect(fs.existsSync(installedDir('bad-main'))).toBe(false)
  })

  it('rejects a bad version before copying', () => {
    writeSource({
      name: 'bad-version', version: 'not-semver', displayName: 'x', description: 'x',
      main: 'index.js', contributes: {},
    })
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/version/i)
    expect(fs.existsSync(installedDir('bad-version'))).toBe(false)
  })

  it('still installs a fully valid plugin', () => {
    writeSource({
      name: 'good', version: '1.0.0', displayName: 'Good', description: 'x',
      main: 'index.js', contributes: {},
    })
    const result = buildCoordinator().installFromPath(src)
    expect(result.success).toBe(true)
    expect(fs.existsSync(path.join(installedDir('good'), 'index.js'))).toBe(true)
  })
})
