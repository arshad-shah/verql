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

import * as coreFormatsPlugin from '../../src/main/plugins/bundled/core-formats/index'
import * as aiPlugin from '../../src/main/plugins/bundled/ai/index'
import * as postgresqlPlugin from '../../src/main/plugins/bundled/postgresql/index'
import * as mysqlPlugin from '../../src/main/plugins/bundled/mysql/index'
import * as sqlitePlugin from '../../src/main/plugins/bundled/sqlite/index'
import * as snowflakePlugin from '../../src/main/plugins/bundled/snowflake/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {},
  listKeys: async () => []
}

async function bootCoordinator() {
  const driverRegistry = new DriverRegistryImpl()
  const exporterRegistry = new ExporterRegistryImpl()
  const importerRegistry = new ImporterRegistryImpl()
  const coordinator = new PluginBootCoordinator({
    driverRegistry,
    commandRegistry: new CommandRegistryImpl(),
    panelRegistry: new PanelRegistryImpl(),
    uiRegistry: new UIRegistryImpl(),
    completionRegistry: new CompletionRegistryImpl(),
    getAdapter: () => undefined,
    getProfile: () => undefined,
    keyring: noopKeyring,
    settingsStore: { get: () => undefined, set: () => {} },
    services: new ServiceRegistryImpl(),
    exporterRegistry,
    importerRegistry
  })
  coordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)
  coordinator.registerBundledPlugin(coreFormatsPlugin.manifest, coreFormatsPlugin)
  coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
  coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
  coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
  coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
  coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)

  for (const name of [
    'dbstudio-plugin-ai',
    'dbstudio-plugin-core-formats',
    'dbstudio-plugin-postgresql',
    'dbstudio-plugin-mysql',
    'dbstudio-plugin-sqlite',
    'dbstudio-plugin-snowflake',
    'dbstudio-plugin-mongodb',
    'dbstudio-plugin-redis'
  ]) {
    const p = coordinator.getPlugin(name)!
    await coordinator.activatePlugin(p)
  }
  return { coordinator, exporterRegistry, importerRegistry, driverRegistry }
}

describe('Plugin-driven export/import architecture', () => {
  let exporterRegistry: ExporterRegistryImpl
  let importerRegistry: ImporterRegistryImpl
  let driverRegistry: DriverRegistryImpl

  beforeEach(async () => {
    const r = await bootCoordinator()
    exporterRegistry = r.exporterRegistry
    importerRegistry = r.importerRegistry
    driverRegistry = r.driverRegistry
  })

  it('core-formats plugin registers CSV and JSON exporters', () => {
    const csv = exporterRegistry.resolve('csv', 'postgresql')
    const json = exporterRegistry.resolve('json', 'mongodb')
    expect(csv).toBeDefined()
    expect(json).toBeDefined()
    expect(csv!.extension).toBe('csv')
    expect(json!.extension).toBe('json')
  })

  it('each relational driver plugin registers its own SQL exporter', () => {
    expect(exporterRegistry.resolve('sql', 'postgresql')!.displayName).toBe('SQL (PostgreSQL)')
    expect(exporterRegistry.resolve('sql', 'mysql')!.displayName).toBe('SQL (MySQL)')
    expect(exporterRegistry.resolve('sql', 'sqlite')!.displayName).toBe('SQL (SQLite)')
  })

  it('non-relational drivers do not get a SQL exporter', () => {
    expect(exporterRegistry.resolve('sql', 'mongodb')).toBeUndefined()
    expect(exporterRegistry.resolve('sql', 'redis')).toBeUndefined()
  })

  it('Postgres SQL exporter produces correctly-quoted DDL', () => {
    const exp = exporterRegistry.resolve('sql', 'postgresql')!
    const out = exp.execute(
      [{ id: 1, name: 'Alice' }],
      [
        { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null },
        { name: 'name', dataType: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: null }
      ],
      { tableName: 'users', connectionType: 'postgresql', includeSchema: true }
    )
    expect(out).toContain('CREATE TABLE "users"')
    expect(out).toContain('"id" integer PRIMARY KEY')
    expect(out).toContain(`INSERT INTO "users" ("id", "name") VALUES (1, 'Alice');`)
  })

  it('MySQL SQL exporter uses backtick quoting', () => {
    const exp = exporterRegistry.resolve('sql', 'mysql')!
    const out = exp.execute(
      [{ id: 1 }],
      [{ name: 'id', dataType: 'int', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null }],
      { tableName: 'users', connectionType: 'mysql' }
    )
    expect(out).toContain('INSERT INTO `users` (`id`) VALUES (1);')
  })

  it('SQL importer for each dialect is registered', () => {
    expect(importerRegistry.findByExtension('sql', 'postgresql')).toBeDefined()
    expect(importerRegistry.findByExtension('sql', 'mysql')).toBeDefined()
    expect(importerRegistry.findByExtension('sql', 'sqlite')).toBeDefined()
    expect(importerRegistry.findByExtension('sql', 'mongodb')).toBeUndefined()
  })

  it('CSV importer is available for all connections (no appliesTo)', () => {
    expect(importerRegistry.findByExtension('csv', 'postgresql')).toBeDefined()
    expect(importerRegistry.findByExtension('csv', 'mongodb')).toBeDefined()
    expect(importerRegistry.findByExtension('csv', 'redis')).toBeDefined()
  })

  it('Snowflake plugin registers SQL exporter + importer', () => {
    expect(exporterRegistry.resolve('sql', 'snowflake')!.displayName).toBe('SQL (Snowflake)')
    expect(importerRegistry.findByExtension('sql', 'snowflake')).toBeDefined()
  })

  it('MongoDB plugin registers JSON Lines + JSON Array exporters and a JSONL importer', () => {
    expect(exporterRegistry.resolve('jsonl', 'mongodb')).toBeDefined()
    expect(exporterRegistry.resolve('json', 'mongodb')).toBeDefined()
    expect(importerRegistry.findByExtension('jsonl', 'mongodb')).toBeDefined()
    expect(importerRegistry.findByExtension('ndjson', 'mongodb')).toBeDefined()
  })

  it('Redis plugin registers a JSON exporter', () => {
    expect(exporterRegistry.resolve('json', 'redis')).toBeDefined()
  })

  it('every bundled driver registers getTableData so the orchestrator never assumes SQL', () => {
    for (const t of ['postgresql', 'mysql', 'sqlite', 'snowflake', 'mongodb', 'redis']) {
      const driver = driverRegistry.get(t)
      expect(driver, `driver for ${t}`).toBeDefined()
      expect(driver!.getTableData, `${t}.getTableData`).toBeTypeOf('function')
    }
  })

  it('relational drivers declare their sqlDialect; non-relational ones do not', () => {
    expect(driverRegistry.get('postgresql')!.sqlDialect).toBe('postgresql')
    expect(driverRegistry.get('mysql')!.sqlDialect).toBe('mysql')
    expect(driverRegistry.get('sqlite')!.sqlDialect).toBe('sqlite')
    expect(driverRegistry.get('snowflake')!.sqlDialect).toBe('snowflake')
    expect(driverRegistry.get('mongodb')!.sqlDialect).toBeUndefined()
    expect(driverRegistry.get('redis')!.sqlDialect).toBeUndefined()
  })

  it('JSON-lines exporter formats one document per line', () => {
    const exp = exporterRegistry.resolve('jsonl', 'mongodb')!
    const out = exp.execute(
      [{ _id: '1', name: 'Alice' }, { _id: '2', name: 'Bob' }],
      [],
      { tableName: 'users', connectionType: 'mongodb' }
    )
    expect(out).toBe('{"_id":"1","name":"Alice"}\n{"_id":"2","name":"Bob"}\n')
  })

  it('Redis JSON exporter dumps the key/value rows as pretty JSON', () => {
    const exp = exporterRegistry.resolve('json', 'redis')!
    const out = exp.execute(
      [{ key: 'user:1', type: 'string', value: 'Alice' }],
      [],
      { tableName: 'user', connectionType: 'redis' }
    )
    expect(JSON.parse(out as string)).toEqual([
      { key: 'user:1', type: 'string', value: 'Alice' }
    ])
  })
})
