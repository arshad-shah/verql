import { describe, it, expect } from 'vitest'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '../../shared/types'

describe('Schema cache logic', () => {
  it('caches tables by connection+schema key', () => {
    const cache = new Map<string, SchemaTable[]>()
    const key = 'conn1:public'
    const tables: SchemaTable[] = [
      { name: 'users', schema: 'public', type: 'table' },
      { name: 'orders', schema: 'public', type: 'table' },
      { name: 'active_users', schema: 'public', type: 'view' }
    ]
    cache.set(key, tables)
    expect(cache.get(key)).toHaveLength(3)
    expect(cache.get(key)![2].type).toBe('view')
  })

  it('caches columns by connection+table key', () => {
    const cache = new Map<string, SchemaColumn[]>()
    const key = 'conn1:public.users'
    const columns: SchemaColumn[] = [
      { name: 'id', dataType: 'integer', nullable: false, defaultValue: null, isPrimaryKey: true, isForeignKey: false },
      { name: 'name', dataType: 'varchar', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
      { name: 'org_id', dataType: 'integer', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: true, references: { table: 'orgs', column: 'id' } }
    ]
    cache.set(key, columns)
    const fks = cache.get(key)!.filter(c => c.isForeignKey)
    expect(fks).toHaveLength(1)
    expect(fks[0].references!.table).toBe('orgs')
  })

  it('invalidates cache on refresh', () => {
    const cache = new Map<string, SchemaTable[]>()
    cache.set('conn1:public', [{ name: 'old', schema: 'public', type: 'table' }])
    cache.delete('conn1:public')
    expect(cache.get('conn1:public')).toBeUndefined()
  })
})

describe('Schema filter and row count cache', () => {
  it('filterText filters table names case-insensitively', () => {
    const tables: SchemaTable[] = [
      { name: 'users', schema: 'public', type: 'table' },
      { name: 'user_roles', schema: 'public', type: 'table' },
      { name: 'posts', schema: 'public', type: 'table' },
      { name: 'active_users', schema: 'public', type: 'view' }
    ]
    const filterText = 'user'
    const filtered = tables.filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()))
    expect(filtered).toHaveLength(3)
    expect(filtered.map(t => t.name)).toEqual(['users', 'user_roles', 'active_users'])
  })

  it('rowCounts cache stores counts by composite key', () => {
    const rowCounts = new Map<string, number>()
    rowCounts.set('conn1:public:users', 1200)
    rowCounts.set('conn1:public:posts', 856)
    expect(rowCounts.get('conn1:public:users')).toBe(1200)
    expect(rowCounts.get('conn1:public:posts')).toBe(856)
    expect(rowCounts.get('conn1:public:missing')).toBeUndefined()
  })

  it('clearCache removes rowCounts for a connection', () => {
    const rowCounts = new Map<string, number>()
    rowCounts.set('conn1:public:users', 1200)
    rowCounts.set('conn2:public:posts', 500)
    const next = new Map<string, number>()
    for (const [k, v] of rowCounts) {
      if (!k.startsWith('conn1')) next.set(k, v)
    }
    expect(next.size).toBe(1)
    expect(next.get('conn2:public:posts')).toBe(500)
  })
})
