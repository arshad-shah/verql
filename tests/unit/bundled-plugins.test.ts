import { describe, it, expect, beforeEach } from 'vitest'
import { PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'

import * as sshPlugin from '../../src/main/plugins/bundled/ssh-tunnel/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'

describe('Bundled Plugins', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl

  beforeEach(() => {
    driverRegistry = new DriverRegistryImpl()
    const commandRegistry = new CommandRegistryImpl()
    const panelRegistry = new PanelRegistryImpl()
    coordinator = new PluginBootCoordinator({
      driverRegistry,
      commandRegistry,
      panelRegistry,
      getAdapter: () => undefined,
      getProfile: () => undefined,
      settingsStore: { get: () => undefined, set: () => {} }
    })
  })

  it('SSH plugin registers middleware', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-ssh')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
  })

  it('MongoDB plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-mongodb')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mongodb')).toBe(true)
  })

  it('Redis plugin registers driver', async () => {
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-redis')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('redis')).toBe(true)
  })

  it('all three plugins can be activated together', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)

    for (const name of ['dbstudio-plugin-ssh', 'dbstudio-plugin-mongodb', 'dbstudio-plugin-redis']) {
      const plugin = coordinator.getPlugin(name)!
      await coordinator.activatePlugin(plugin)
      expect(plugin.status.state).toBe('active')
    }

    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
    expect(driverRegistry.has('mongodb')).toBe(true)
    expect(driverRegistry.has('redis')).toBe(true)
  })
})
