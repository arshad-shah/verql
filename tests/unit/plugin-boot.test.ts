import { describe, it, expect, vi, beforeEach } from 'vitest'
import os from 'os'
import path from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => path.join(os.tmpdir(), 'verql-plugin-boot-test') }
}))

import { validateManifest, PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../src/main/plugins/sdk/completion-registry'
import { ServiceRegistryImpl } from '../../src/main/plugins/sdk/service-registry'
import { ExporterRegistryImpl } from '../../src/main/plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from '../../src/main/plugins/sdk/importer-registry'
import { TypeMapperRegistryImpl } from '../../src/main/plugins/sdk/type-mapper-registry'
import { ThemeRegistryImpl } from '../../src/main/plugins/sdk/theme-registry'
import { DragDropRegistryImpl } from '../../src/main/plugins/sdk/drag-drop-registry'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {},
  listKeys: async () => []
}

describe('PluginBootCoordinator', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl
  let commandRegistry: CommandRegistryImpl
  let panelRegistry: PanelRegistryImpl

  beforeEach(() => {
    driverRegistry = new DriverRegistryImpl()
    commandRegistry = new CommandRegistryImpl()
    panelRegistry = new PanelRegistryImpl()
    const uiRegistry = new UIRegistryImpl()
    const completionRegistry = new CompletionRegistryImpl()
    coordinator = new PluginBootCoordinator({
      driverRegistry,
      commandRegistry,
      panelRegistry,
      uiRegistry,
      completionRegistry,
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
      dragDropRegistry: new DragDropRegistryImpl()
    })
  })

  it('validates a correct manifest', () => {
    const result = validateManifest({
      name: 'test-plugin', version: '1.0.0', displayName: 'Test',
      description: 'Desc', main: 'dist/index.js', contributes: {}
    })
    expect(result.valid).toBe(true)
  })

  it('rejects an invalid manifest', () => {
    const result = validateManifest({
      name: '', version: '1.0.0', displayName: 'Test',
      description: 'Desc', main: 'dist/index.js', contributes: {}
    })
    expect(result.valid).toBe(false)
  })

  it('activates a plugin that exports activate()', async () => {
    const fakeModule = { activate: vi.fn() }
    const plugin = {
      manifest: {
        name: 'good-plugin', version: '1.0.0', displayName: 'Good',
        description: 'Works', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('active')
    expect(fakeModule.activate).toHaveBeenCalledOnce()
  })

  it('sets error status when activate() throws', async () => {
    const fakeModule = { activate: vi.fn(() => { throw new Error('boom') }) }
    const plugin = {
      manifest: {
        name: 'bad-plugin', version: '1.0.0', displayName: 'Bad',
        description: 'Fails', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('error')
    if (result.status.state === 'error') {
      expect(result.status.phase).toBe('activate')
      expect(result.status.error).toContain('boom')
    }
  })

  it('sets degraded status when contributions are partially registered', async () => {
    const fakeModule = {
      activate: vi.fn((ctx: any) => {
        ctx.drivers.register('mongo', {
          createAdapter: () => ({}),
          connectionFields: []
        })
      })
    }
    const plugin = {
      manifest: {
        name: 'partial-plugin', version: '1.0.0', displayName: 'Partial',
        description: 'Partial', main: 'index.js',
        contributes: {
          drivers: [{ id: 'mongo', name: 'MongoDB' }],
          commands: [{ id: 'missing-cmd', title: 'Missing' }]
        }
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('degraded')
  })

  it('registers and activates a bundled plugin', async () => {
    const fakeModule = {
      activate: vi.fn((ctx: any) => {
        ctx.drivers.register('testdb', {
          createAdapter: () => ({}),
          connectionFields: []
        })
      })
    }
    const manifest = {
      name: 'bundled-test', version: '1.0.0', displayName: 'Bundled Test',
      description: 'Test', main: 'index.js',
      contributes: { drivers: [{ id: 'testdb', name: 'TestDB' }] }
    }

    coordinator.registerBundledPlugin(manifest, fakeModule)
    const plugin = coordinator.getPlugin('bundled-test')
    expect(plugin).toBeDefined()
    expect(plugin!.status.state).toBe('validated')

    const result = await coordinator.activatePlugin(plugin!)
    expect(result.status.state).toBe('active')
    expect(fakeModule.activate).toHaveBeenCalledOnce()
    expect(driverRegistry.has('testdb')).toBe(true)
  })

  it('rejects bundled plugins with invalid manifests', () => {
    const badManifest = {
      name: '', version: '1.0.0', displayName: 'Broken',
      description: 'No name', main: 'index.js', contributes: {}
    }
    expect(() => coordinator.registerBundledPlugin(badManifest, { activate: () => {} }))
      .toThrow(/Invalid bundled plugin manifest/)
  })

  it('rejects bundled plugins with malformed semver', () => {
    const badManifest = {
      name: 'bad-semver', version: 'not-a-version', displayName: 'Broken',
      description: 'Bad semver', main: 'index.js', contributes: {}
    }
    expect(() => coordinator.registerBundledPlugin(badManifest, { activate: () => {} }))
      .toThrow(/Invalid bundled plugin manifest/)
  })

  it('rejects double-registration of the same bundled plugin name', () => {
    const manifest = {
      name: 'dup-plugin', version: '1.0.0', displayName: 'Dup',
      description: 'Desc', main: 'index.js', contributes: {}
    }
    coordinator.registerBundledPlugin(manifest, { activate: () => {} })
    expect(() => coordinator.registerBundledPlugin(manifest, { activate: () => {} }))
      .toThrow(/already registered/)
  })

  it('refuses to uninstall a bundled plugin', () => {
    const manifest = {
      name: 'cannot-remove', version: '1.0.0', displayName: 'Bundled',
      description: 'Desc', main: 'index.js', contributes: {}
    }
    coordinator.registerBundledPlugin(manifest, { activate: () => {} })
    expect(() => coordinator.uninstall('cannot-remove'))
      .toThrow(/Cannot uninstall bundled plugin/)
  })

  it('deactivates a plugin and disposes subscriptions', async () => {
    const deactivateFn = vi.fn()
    const fakeModule = { activate: vi.fn(), deactivate: deactivateFn }
    const plugin = {
      manifest: {
        name: 'deact-plugin', version: '1.0.0', displayName: 'Deact',
        description: 'Desc', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const activated = await coordinator.activatePlugin(plugin)
    await coordinator.deactivatePlugin(activated)
    expect(deactivateFn).toHaveBeenCalledOnce()
    expect(activated.status.state).toBe('inactive')
  })

  describe('disabledPluginsStore persistence', () => {
    function makeDisabledStore(initial: string[] = []) {
      const set = new Set(initial)
      return {
        list: () => [...set],
        store: {
          isDisabled: (name: string) => set.has(name),
          markDisabled: (name: string) => { set.add(name) },
          markEnabled: (name: string) => { set.delete(name) }
        }
      }
    }

    function makeCoordinator(disabledStore: ReturnType<typeof makeDisabledStore>['store']) {
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
        disabledPluginsStore: disabledStore
      })
    }

    const manifest = (name: string) => ({
      name, version: '1.0.0', displayName: name,
      description: 'desc', main: 'index.js', contributes: {}
    })

    it('user-initiated deactivation persists the disabled flag', async () => {
      const disabled = makeDisabledStore()
      const c = makeCoordinator(disabled.store)
      const plugin = {
        manifest: manifest('user-off'),
        path: '<bundled>',
        status: { state: 'validated' as const },
        module: { activate: vi.fn(), deactivate: vi.fn() }
      }
      await c.activatePlugin(plugin)
      await c.deactivatePlugin(plugin, { persist: true })
      expect(disabled.list()).toEqual(['user-off'])
    })

    it('shutdown-style deactivation does NOT persist (defaults to persist:false)', async () => {
      const disabled = makeDisabledStore()
      const c = makeCoordinator(disabled.store)
      const plugin = {
        manifest: manifest('still-enabled'),
        path: '<bundled>',
        status: { state: 'validated' as const },
        module: { activate: vi.fn(), deactivate: vi.fn() }
      }
      await c.activatePlugin(plugin)
      await c.deactivatePlugin(plugin) // no opts — like shutdown/uninstall/auto
      expect(disabled.list()).toEqual([])
    })

    it('boot() skips activation for plugins on the persisted disabled list', async () => {
      const disabled = makeDisabledStore(['skipped'])
      const c = makeCoordinator(disabled.store)
      const activate = vi.fn()
      c.registerBundledPlugin(manifest('skipped'), { activate })
      c.validateAll()
      c.resolveAll()
      await c.boot()
      expect(activate).not.toHaveBeenCalled()
      expect(c.getPlugin('skipped')?.status.state).toBe('inactive')
    })

    it('boot() still activates plugins not on the disabled list', async () => {
      const disabled = makeDisabledStore(['other-one'])
      const c = makeCoordinator(disabled.store)
      const activate = vi.fn()
      c.registerBundledPlugin(manifest('keeper'), { activate })
      c.validateAll()
      c.resolveAll()
      await c.boot()
      expect(activate).toHaveBeenCalledOnce()
      expect(c.getPlugin('keeper')?.status.state).toBe('active')
    })

    it('re-activating a plugin clears the persisted disabled flag', async () => {
      const disabled = makeDisabledStore(['comeback'])
      const c = makeCoordinator(disabled.store)
      const plugin = {
        manifest: manifest('comeback'),
        path: '<bundled>',
        status: { state: 'validated' as const },
        module: { activate: vi.fn(), deactivate: vi.fn() }
      }
      await c.activatePlugin(plugin)
      expect(disabled.list()).toEqual([])
    })

    it('boot() activates an essential plugin even if it is on the disabled list', async () => {
      // db-tools must always be active so the MCP server always has tools,
      // independent of the AI plugin. A stale disabled flag must not keep it off.
      const disabled = makeDisabledStore(['verql-plugin-db-tools'])
      const c = makeCoordinator(disabled.store)
      const activate = vi.fn()
      c.registerBundledPlugin(manifest('verql-plugin-db-tools'), { activate })
      c.validateAll()
      c.resolveAll()
      await c.boot()
      expect(activate).toHaveBeenCalledOnce()
      expect(c.getPlugin('verql-plugin-db-tools')?.status.state).toBe('active')
      // activation clears the stale flag
      expect(disabled.list()).toEqual([])
    })

    it('refuses user-initiated deactivation of an essential plugin', async () => {
      const disabled = makeDisabledStore()
      const c = makeCoordinator(disabled.store)
      const plugin = {
        manifest: manifest('verql-plugin-db-tools'),
        path: '<bundled>',
        status: { state: 'validated' as const },
        module: { activate: vi.fn(), deactivate: vi.fn() }
      }
      await c.activatePlugin(plugin)
      await c.deactivatePlugin(plugin, { persist: true })
      // still active, never marked disabled
      expect(plugin.status.state).toBe('active')
      expect(disabled.list()).toEqual([])
      expect(plugin.module.deactivate).not.toHaveBeenCalled()
    })

    it('disabled flag survives a deactivate → boot cycle (the original bug)', async () => {
      const disabled = makeDisabledStore()

      // Session 1: user deactivates the plugin via the IPC path.
      const c1 = makeCoordinator(disabled.store)
      c1.registerBundledPlugin(manifest('survivor'), { activate: vi.fn(), deactivate: vi.fn() })
      c1.validateAll()
      c1.resolveAll()
      await c1.boot()
      await c1.deactivatePlugin(c1.getPlugin('survivor')!, { persist: true })
      expect(disabled.list()).toEqual(['survivor'])

      // Session 2: fresh coordinator with the same persisted state — must NOT
      // re-activate.
      const activate2 = vi.fn()
      const c2 = makeCoordinator(disabled.store)
      c2.registerBundledPlugin(manifest('survivor'), { activate: activate2 })
      c2.validateAll()
      c2.resolveAll()
      await c2.boot()
      expect(activate2).not.toHaveBeenCalled()
      expect(c2.getPlugin('survivor')?.status.state).toBe('inactive')
    })
  })
})
