import { describe, it, expect } from 'vitest'
import { ExporterRegistryImpl } from '../../src/main/plugins/sdk/exporter-registry'
import type { SchemaColumn } from '@shared/types'

const COLS: SchemaColumn[] = [
  { name: 'id', dataType: 'int', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null }
]
const ROWS = [{ id: 1 }, { id: 2 }]

describe('ExporterRegistryImpl', () => {
  it('registers and retrieves an exporter by format id', () => {
    const reg = new ExporterRegistryImpl()
    reg.register('csv', {
      format: 'csv',
      extension: 'csv',
      displayName: 'CSV',
      execute: (rows) => rows.map(r => Object.values(r).join(',')).join('\n')
    })
    const exp = reg.get('csv')
    expect(exp).toBeDefined()
    expect(exp!.extension).toBe('csv')
  })

  it('lists all exporters', () => {
    const reg = new ExporterRegistryImpl()
    reg.register('csv', { format: 'csv', extension: 'csv', displayName: 'CSV', execute: () => '' })
    reg.register('json', { format: 'json', extension: 'json', displayName: 'JSON', execute: () => '' })
    const list = reg.list()
    expect(list).toHaveLength(2)
    expect(list.map(e => e.format).sort()).toEqual(['csv', 'json'])
  })

  it('filters list by connection type using appliesTo', () => {
    const reg = new ExporterRegistryImpl()
    reg.register('csv', { format: 'csv', extension: 'csv', displayName: 'CSV', execute: () => '' })
    reg.register('sql-pg', {
      format: 'sql',
      extension: 'sql',
      displayName: 'SQL (Postgres)',
      appliesToTypes: ['postgresql'],
      execute: () => ''
    })
    expect(reg.list('postgresql').map(e => e.format).sort()).toEqual(['csv', 'sql'])
    expect(reg.list('mongodb').map(e => e.format)).toEqual(['csv'])
  })

  it('disposing a registration removes the exporter', () => {
    const reg = new ExporterRegistryImpl()
    const d = reg.register('csv', { format: 'csv', extension: 'csv', displayName: 'CSV', execute: () => '' })
    expect(reg.get('csv')).toBeDefined()
    d.dispose()
    expect(reg.get('csv')).toBeUndefined()
  })

  it('replacing an existing id throws', () => {
    const reg = new ExporterRegistryImpl()
    reg.register('csv', { format: 'csv', extension: 'csv', displayName: 'CSV', execute: () => '' })
    expect(() => reg.register('csv', { format: 'csv', extension: 'csv', displayName: 'CSV', execute: () => '' }))
      .toThrow(/already registered/)
  })

  it('executes an exporter end-to-end', () => {
    const reg = new ExporterRegistryImpl()
    reg.register('csv', {
      format: 'csv',
      extension: 'csv',
      displayName: 'CSV',
      execute: (rows, cols) => cols.map(c => c.name).join(',') + '\n' + rows.map(r => cols.map(c => r[c.name]).join(',')).join('\n')
    })
    const out = reg.get('csv')!.execute(ROWS, COLS, { tableName: 'users', connectionType: 'postgresql' })
    expect(out).toBe('id\n1\n2')
  })
})
