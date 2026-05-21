import { describe, it, expect, beforeEach } from 'vitest'
import { mapType, generateMigrationDdl } from '../../src/main/migration/type-map'
import { TypeMapperRegistryImpl } from '../../src/main/plugins/sdk/type-mapper-registry'
import {
  PG_TO_MYSQL, pgToMysqlFallback
} from '../../src/main/plugins/bundled/mysql/type-maps'
import {
  MYSQL_TO_PG, mysqlToPgFallback, sqliteToPgFallback
} from '../../src/main/plugins/bundled/postgresql/type-maps'
import {
  PG_TO_SQLITE, pgToSqliteFallback,
  MYSQL_TO_SQLITE, mysqlToSqliteFallback,
  sqliteToMysqlFallback
} from '../../src/main/plugins/bundled/sqlite/type-maps'

function buildRegistry(): TypeMapperRegistryImpl {
  const reg = new TypeMapperRegistryImpl()
  reg.register('postgresql', 'mysql', PG_TO_MYSQL, pgToMysqlFallback)
  reg.register('postgresql', 'sqlite', PG_TO_SQLITE, pgToSqliteFallback)
  reg.register('mysql', 'postgresql', MYSQL_TO_PG, mysqlToPgFallback)
  reg.register('mysql', 'sqlite', MYSQL_TO_SQLITE, mysqlToSqliteFallback)
  reg.register('sqlite', 'postgresql', {}, sqliteToPgFallback)
  reg.register('sqlite', 'mysql', {}, sqliteToMysqlFallback)
  return reg
}

describe('Type mapping', () => {
  let registry: TypeMapperRegistryImpl
  beforeEach(() => { registry = buildRegistry() })

  it('maps PostgreSQL serial to MySQL INT AUTO_INCREMENT', () => {
    const result = mapType(registry, 'serial', 'postgresql', 'mysql')
    expect(result.target).toBe('INT AUTO_INCREMENT')
    expect(result.lossy).toBe(false)
  })

  it('flags jsonb → JSON as lossy', () => {
    const result = mapType(registry, 'jsonb', 'postgresql', 'mysql')
    expect(result.target).toBe('JSON')
    expect(result.lossy).toBe(true)
    expect(result.note).toContain('jsonb')
  })

  it('maps PostgreSQL timestamptz to MySQL DATETIME as lossy', () => {
    const result = mapType(registry, 'timestamptz', 'postgresql', 'mysql')
    expect(result.target).toBe('DATETIME')
    expect(result.lossy).toBe(true)
  })

  it('maps MySQL int to PostgreSQL integer', () => {
    const result = mapType(registry, 'int', 'mysql', 'postgresql')
    expect(result.target).toBe('integer')
    expect(result.lossy).toBe(false)
  })

  it('maps SQLite INTEGER to PostgreSQL integer via the affinity fallback', () => {
    const result = mapType(registry, 'INTEGER', 'sqlite', 'postgresql')
    expect(result.target).toBe('integer')
  })

  it('maps same type to itself', () => {
    const result = mapType(registry, 'text', 'postgresql', 'postgresql')
    expect(result.target).toBe('text')
    expect(result.lossy).toBe(false)
  })

  it('falls back to TEXT for unknown types in PG→MySQL', () => {
    const result = mapType(registry, 'custom_type', 'postgresql', 'mysql')
    expect(result.target).toBe('TEXT')
    expect(result.lossy).toBe(true)
  })

  it('returns an identity-with-warning when no mapper is registered for a direction', () => {
    const empty = new TypeMapperRegistryImpl()
    const result = mapType(empty, 'jsonb', 'postgresql', 'mysql')
    expect(result.target).toBe('jsonb')
    expect(result.lossy).toBe(true)
    expect(result.note).toMatch(/No type mapper registered/)
  })
})

describe('Migration DDL generation', () => {
  let registry: TypeMapperRegistryImpl
  beforeEach(() => { registry = buildRegistry() })

  it('generates CREATE TABLE with mapped types (PG → MySQL)', () => {
    const columns = [
      { name: 'id', dataType: 'serial', nullable: false, isPrimaryKey: true, defaultValue: null },
      { name: 'name', dataType: 'character varying', nullable: false, isPrimaryKey: false, defaultValue: null },
      { name: 'data', dataType: 'jsonb', nullable: true, isPrimaryKey: false, defaultValue: null }
    ]
    const { ddl, mappings } = generateMigrationDdl(registry, 'users', columns, 'postgresql', 'mysql')
    expect(ddl).toContain('INT AUTO_INCREMENT')
    expect(ddl).toContain('VARCHAR(255)')
    expect(ddl).toContain('JSON')
    expect(ddl).toContain('`users`')   // MySQL identifier quoting
    expect(mappings[2].lossy).toBe(true)
  })

  it('uses SQLite INTEGER PRIMARY KEY idiom when migrating to SQLite', () => {
    const columns = [
      { name: 'id', dataType: 'serial', nullable: false, isPrimaryKey: true, defaultValue: null },
      { name: 'data', dataType: 'jsonb', nullable: true, isPrimaryKey: false, defaultValue: null }
    ]
    const { ddl } = generateMigrationDdl(registry, 'users', columns, 'postgresql', 'sqlite')
    expect(ddl).toContain('INTEGER PRIMARY KEY')
    expect(ddl).toContain('"users"')   // SQLite double-quote identifier
  })
})
