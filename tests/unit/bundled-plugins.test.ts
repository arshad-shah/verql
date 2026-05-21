import { describe, it, expect, beforeEach } from 'vitest'
import { PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../src/main/plugins/sdk/completion-registry'
import { ServiceRegistryImpl } from '../../src/main/plugins/sdk/service-registry'
import { ExporterRegistryImpl } from '../../src/main/plugins/sdk/exporter-registry'
import { ImporterRegistryImpl } from '../../src/main/plugins/sdk/importer-registry'
import { TypeMapperRegistryImpl } from '../../src/main/plugins/sdk/type-mapper-registry'

import * as sshPlugin from '../../src/main/plugins/bundled/ssh-tunnel/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'
import * as snowflakePlugin from '../../src/main/plugins/bundled/snowflake/index'
import * as postgresqlPlugin from '../../src/main/plugins/bundled/postgresql/index'
import * as mysqlPlugin from '../../src/main/plugins/bundled/mysql/index'
import * as sqlitePlugin from '../../src/main/plugins/bundled/sqlite/index'
import * as aiPlugin from '../../src/main/plugins/bundled/ai/index'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {},
  listKeys: async () => []
}

describe('Bundled Plugins', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl

  beforeEach(async () => {
    driverRegistry = new DriverRegistryImpl()
    const commandRegistry = new CommandRegistryImpl()
    const panelRegistry = new PanelRegistryImpl()
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
      typeMapperRegistry: new TypeMapperRegistryImpl()
    })
    // The AI plugin provides the `ai` service that mongo/redis plugins consume
    // at activation. Register and activate it first to mirror production boot.
    coordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)
    const ai = coordinator.getPlugin('verql-plugin-ai')!
    await coordinator.activatePlugin(ai)
  })

  it('SSH plugin registers middleware', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    const plugin = coordinator.getPlugin('verql-plugin-ssh')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
  })

  it('MongoDB plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    const plugin = coordinator.getPlugin('verql-plugin-mongodb')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mongodb')).toBe(true)
  })

  it('Redis plugin registers driver', async () => {
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
    const plugin = coordinator.getPlugin('verql-plugin-redis')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('redis')).toBe(true)
  })

  it('Snowflake plugin registers driver', async () => {
    coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
    const plugin = coordinator.getPlugin('verql-plugin-snowflake')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('snowflake')).toBe(true)
  })

  it('PostgreSQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
    const plugin = coordinator.getPlugin('verql-plugin-postgresql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('postgresql')).toBe(true)
  })

  it('MySQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
    const plugin = coordinator.getPlugin('verql-plugin-mysql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mysql')).toBe(true)
  })

  it('SQLite plugin registers driver', async () => {
    coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
    const plugin = coordinator.getPlugin('verql-plugin-sqlite')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('sqlite')).toBe(true)
  })

  it('all plugins can be activated together', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
    coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
    coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
    coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
    coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)

    for (const name of [
      'verql-plugin-ssh', 'verql-plugin-mongodb', 'verql-plugin-redis',
      'verql-plugin-snowflake', 'verql-plugin-postgresql', 'verql-plugin-mysql',
      'verql-plugin-sqlite'
    ]) {
      const plugin = coordinator.getPlugin(name)!
      await coordinator.activatePlugin(plugin)
      expect(plugin.status.state).toBe('active')
    }

    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
    expect(driverRegistry.has('mongodb')).toBe(true)
    expect(driverRegistry.has('redis')).toBe(true)
    expect(driverRegistry.has('snowflake')).toBe(true)
    expect(driverRegistry.has('postgresql')).toBe(true)
    expect(driverRegistry.has('mysql')).toBe(true)
    expect(driverRegistry.has('sqlite')).toBe(true)
  })
})
