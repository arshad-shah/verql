import { describe, it, expect, beforeEach } from 'vitest'
import { PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../../src/main/plugins/sdk/completion-registry'
import { AIToolRegistry } from '../../src/main/ai/tool-registry'
import { AIProviderRegistry } from '../../src/main/ai/provider-registry'
import { ConversationManager } from '../../src/main/ai/conversation-manager'
import { PermissionManager } from '../../src/main/ai/permission-manager'

import * as sshPlugin from '../../src/main/plugins/bundled/ssh-tunnel/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'
import * as snowflakePlugin from '../../src/main/plugins/bundled/snowflake/index'
import * as postgresqlPlugin from '../../src/main/plugins/bundled/postgresql/index'
import * as mysqlPlugin from '../../src/main/plugins/bundled/mysql/index'
import * as sqlitePlugin from '../../src/main/plugins/bundled/sqlite/index'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {}
}

describe('Bundled Plugins', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl

  beforeEach(() => {
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
      aiToolRegistry: new AIToolRegistry(),
      aiProviderRegistry: new AIProviderRegistry(),
      aiConversationManager: new ConversationManager({
        providerRegistry: new AIProviderRegistry(),
        toolRegistry: new AIToolRegistry(),
        permissionManager: new PermissionManager(),
        getSchemaContext: async () => '',
        getConnectionId: () => null
      })
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

  it('Snowflake plugin registers driver', async () => {
    coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-snowflake')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('snowflake')).toBe(true)
  })

  it('PostgreSQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-postgresql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('postgresql')).toBe(true)
  })

  it('MySQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-mysql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mysql')).toBe(true)
  })

  it('SQLite plugin registers driver', async () => {
    coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-sqlite')!
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
      'dbstudio-plugin-ssh', 'dbstudio-plugin-mongodb', 'dbstudio-plugin-redis',
      'dbstudio-plugin-snowflake', 'dbstudio-plugin-postgresql', 'dbstudio-plugin-mysql',
      'dbstudio-plugin-sqlite'
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
