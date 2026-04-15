// tests/unit/ai-schema-tools.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createSchemaTools } from '../../src/main/plugins/bundled/ai/tools/schema-tools'
import type { SchemaAccess } from '../../src/main/plugins/sdk/types'

const mockSchema: SchemaAccess = {
  getTables: vi.fn(async () => [{ name: 'users', type: 'table' as const, schema: 'public' }]),
  getColumns: vi.fn(async () => [
    { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null },
    { name: 'email', dataType: 'varchar', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: null }
  ]),
  getIndexes: vi.fn(async () => []),
  getSchemas: vi.fn(async () => ['public']),
  getDatabases: vi.fn(async () => ['mydb']),
  getSchemaSummary: vi.fn(async () => ({ tables: [] }))
}

describe('Schema tools', () => {
  it('creates listTables tool', () => {
    const tools = createSchemaTools(mockSchema)
    const listTables = tools.find(t => t.id === 'schema.listTables')
    expect(listTables).toBeDefined()
    expect(listTables!.permission).toBe('read')
  })

  it('listTables returns table names', async () => {
    const tools = createSchemaTools(mockSchema)
    const listTables = tools.find(t => t.id === 'schema.listTables')!
    const result = await listTables.execute(
      {},
      { connectionId: 'conn-1', abortSignal: new AbortController().signal }
    )
    expect(result.success).toBe(true)
    expect(result.data).toEqual([{ name: 'users', type: 'table', schema: 'public' }])
  })

  it('describeTable returns columns', async () => {
    const tools = createSchemaTools(mockSchema)
    const describeTool = tools.find(t => t.id === 'schema.describeTable')!
    const result = await describeTool.execute(
      { table: 'users' },
      { connectionId: 'conn-1', abortSignal: new AbortController().signal }
    )
    expect(result.success).toBe(true)
    expect((result.data as any).columns).toHaveLength(2)
  })

  it('returns error when no connection', async () => {
    const tools = createSchemaTools(mockSchema)
    const listTables = tools.find(t => t.id === 'schema.listTables')!
    const result = await listTables.execute(
      {},
      { connectionId: null, abortSignal: new AbortController().signal }
    )
    expect(result.success).toBe(false)
  })
})
