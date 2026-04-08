import { describe, it, expect } from 'vitest'
import { mapType, generateMigrationDdl } from '../../src/main/migration/type-map'

describe('Type mapping', () => {
  it('maps PostgreSQL serial to MySQL INT AUTO_INCREMENT', () => {
    const result = mapType('serial', 'postgresql', 'mysql')
    expect(result.target).toBe('INT AUTO_INCREMENT')
    expect(result.lossy).toBe(false)
  })

  it('flags jsonb → JSON as lossy', () => {
    const result = mapType('jsonb', 'postgresql', 'mysql')
    expect(result.target).toBe('JSON')
    expect(result.lossy).toBe(true)
    expect(result.note).toContain('jsonb')
  })

  it('maps PostgreSQL timestamptz to MySQL DATETIME as lossy', () => {
    const result = mapType('timestamptz', 'postgresql', 'mysql')
    expect(result.target).toBe('DATETIME')
    expect(result.lossy).toBe(true)
  })

  it('maps MySQL int to PostgreSQL integer', () => {
    const result = mapType('int', 'mysql', 'postgresql')
    expect(result.target).toBe('integer')
    expect(result.lossy).toBe(false)
  })

  it('maps SQLite INTEGER to PostgreSQL integer', () => {
    const result = mapType('INTEGER', 'sqlite', 'postgresql')
    expect(result.target).toBe('integer')
  })

  it('maps same type to itself', () => {
    const result = mapType('text', 'postgresql', 'postgresql')
    expect(result.target).toBe('text')
    expect(result.lossy).toBe(false)
  })

  it('falls back to TEXT for unknown types', () => {
    const result = mapType('custom_type', 'postgresql', 'mysql')
    expect(result.target).toBe('TEXT')
    expect(result.lossy).toBe(true)
  })
})

describe('Migration DDL generation', () => {
  it('generates CREATE TABLE with mapped types', () => {
    const columns = [
      { name: 'id', dataType: 'serial', nullable: false, isPrimaryKey: true, defaultValue: null },
      { name: 'name', dataType: 'character varying', nullable: false, isPrimaryKey: false, defaultValue: null },
      { name: 'data', dataType: 'jsonb', nullable: true, isPrimaryKey: false, defaultValue: null }
    ]
    const { ddl, mappings } = generateMigrationDdl('users', columns, 'postgresql', 'mysql')
    expect(ddl).toContain('INT AUTO_INCREMENT')
    expect(ddl).toContain('VARCHAR(255)')
    expect(ddl).toContain('JSON')
    expect(mappings[2].lossy).toBe(true)
  })
})
