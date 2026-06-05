// Security regression: installFromZip must extract into an unpredictable,
// owner-only temp directory.
//
// The original code used `os.tmpdir()/verql-plugin-${Date.now()}` +
// `mkdirSync({recursive:true})`. The name is guessable to the millisecond,
// and recursive mkdir silently succeeds on a pre-existing dir — so on a
// shared machine a local attacker can pre-create the directory (or plant a
// symlink inside) before `unzip -o` overwrites into it. `fs.mkdtempSync`
// atomically creates a fresh 0700 dir with a random suffix, closing the race.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'

const USER_DATA = path.join(os.tmpdir(), 'verql-zip-tmpdir-test-userdata')
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

let workdir: string

function makePluginZip(name: string): string {
  const stage = fs.mkdtempSync(path.join(workdir, 'stage-'))
  const pkg = path.join(stage, name)
  fs.mkdirSync(pkg)
  fs.writeFileSync(
    path.join(pkg, 'plugin-manifest.json'),
    JSON.stringify({ name, version: '1.0.0', displayName: name, description: 'x', main: 'index.js', contributes: {} }),
  )
  fs.writeFileSync(path.join(pkg, 'index.js'), 'exports.activate = () => {}')
  const zipPath = path.join(workdir, `${name}.zip`)
  execFileSync('zip', ['-r', '-q', zipPath, name], { cwd: stage })
  return zipPath
}

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'verql-zip-test-'))
})
afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true })
  fs.rmSync(USER_DATA, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('installFromZip — temp dir hardening', () => {
  it('extracts via fs.mkdtempSync (unpredictable dir), not a guessable name', () => {
    const mkdtempSpy = vi.spyOn(fs, 'mkdtempSync')
    const zip = makePluginZip('zip-plugin')

    const result = buildCoordinator().installFromZip(zip)

    expect(result.success).toBe(true)
    expect(result.name).toBe('zip-plugin')
    // The install must have created its extraction dir via mkdtempSync.
    const usedMkdtemp = mkdtempSpy.mock.calls.some(([prefix]) =>
      String(prefix).includes('verql-plugin-'),
    )
    expect(usedMkdtemp).toBe(true)
    // And the plugin actually landed in the trusted dir.
    expect(fs.existsSync(path.join(USER_DATA, 'plugins', 'zip-plugin', 'index.js'))).toBe(true)
  })

  it('cleans up its temp dir afterwards', () => {
    const mkdtempSpy = vi.spyOn(fs, 'mkdtempSync')
    const zip = makePluginZip('zip-plugin-2')
    buildCoordinator().installFromZip(zip)
    const tmpDirs = mkdtempSpy.mock.results
      .map(r => r.value as string)
      .filter(v => typeof v === 'string' && v.includes('verql-plugin-'))
    for (const d of tmpDirs) expect(fs.existsSync(d)).toBe(false)
  })
})
