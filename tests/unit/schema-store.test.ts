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
