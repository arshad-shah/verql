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

  for (const name of [
    'dbstudio-plugin-ai',
    'dbstudio-plugin-core-formats',
    'dbstudio-plugin-postgresql',
    'dbstudio-plugin-mysql',
    'dbstudio-plugin-sqlite'
  ]) {
    const p = coordinator.getPlugin(name)!
    await coordinator.activatePlugin(p)
  }
  return { coordinator, exporterRegistry, importerRegistry }
}

describe('Plugin-driven export/import architecture', () => {
  let exporterRegistry: ExporterRegistryImpl
  let importerRegistry: ImporterRegistryImpl

  beforeEach(async () => {
    const r = await bootCoordinator()
    exporterRegistry = r.exporterRegistry
    importerRegistry = r.importerRegistry
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
})
