import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateManifest, PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../src/main/plugins/sdk/completion-registry'

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
      settingsStore: { get: () => undefined, set: () => {} }
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
})
