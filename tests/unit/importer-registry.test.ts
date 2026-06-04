import { describe, it, expect } from 'vitest'
import { ImporterRegistryImpl } from '../../src/main/plugins/sdk/importer-registry'

describe('ImporterRegistryImpl', () => {
  it('registers and retrieves an importer by id', () => {
    const reg = new ImporterRegistryImpl()
    reg.register('csv', {
      format: 'csv',
      extensions: ['csv', 'tsv'],
      displayName: 'CSV / TSV',
      parse: (content: string) => ({ rows: content.split('\n').map(l => ({ line: l })), columns: ['line'] })
    })
    const imp = reg.get('csv')
    expect(imp).toBeDefined()
    expect(imp!.extensions).toContain('csv')
  })

  it('finds importer by file extension', () => {
    const reg = new ImporterRegistryImpl()
    reg.register('csv', { format: 'csv', extensions: ['csv', 'tsv'], displayName: 'CSV', parse: () => ({ rows: [], columns: [] }) })
    reg.register('sql', { format: 'sql', extensions: ['sql'], displayName: 'SQL', parse: () => ({ rows: [], columns: [] }) })
    expect(reg.findByExtension('csv')!.format).toBe('csv')
    expect(reg.findByExtension('tsv')!.format).toBe('csv')
    expect(reg.findByExtension('sql')!.format).toBe('sql')
    expect(reg.findByExtension('xml')).toBeUndefined()
  })

  it('lists importers, optionally filtered by connection type', () => {
    const reg = new ImporterRegistryImpl()
    reg.register('csv', { format: 'csv', extensions: ['csv'], displayName: 'CSV', parse: () => ({ rows: [], columns: [] }) })
    reg.register('mongo-bson', {
      format: 'bson',
      extensions: ['bson'],
      displayName: 'BSON',
      appliesToTypes: ['mongodb'],
      parse: () => ({ rows: [], columns: [] })
    })
    expect(reg.list('mongodb').map(i => i.format).sort()).toEqual(['bson', 'csv'])
    expect(reg.list('postgresql').map(i => i.format)).toEqual(['csv'])
  })

  it('disposing a registration removes the importer', () => {
    const reg = new ImporterRegistryImpl()
    const d = reg.register('csv', { format: 'csv', extensions: ['csv'], displayName: 'CSV', parse: () => ({ rows: [], columns: [] }) })
    d.dispose()
    expect(reg.get('csv')).toBeUndefined()
    expect(reg.findByExtension('csv')).toBeUndefined()
  })

  it('replacing an existing id throws', () => {
    const reg = new ImporterRegistryImpl()
    reg.register('csv', { format: 'csv', extensions: ['csv'], displayName: 'CSV', parse: () => ({ rows: [], columns: [] }) })
    expect(() => reg.register('csv', { format: 'csv', extensions: ['csv'], displayName: 'CSV', parse: () => ({ rows: [], columns: [] }) }))
      .toThrow(/already registered/)
  })
})
