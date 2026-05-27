import { describe, it, expect } from 'vitest'
import { createDbTools } from '../../../src/main/plugins/bundled/db-tools/tools'
import type { SchemaAccess, ConnectionAccess } from '../../../src/main/plugins/sdk/types'

const ctx = { connectionId: 'c1', abortSignal: new AbortController().signal }

function fakes() {
  const schema = {
    getTables: async () => [{ name: 't', type: 'table', rowCount: 1 }],
    getColumns: async () => [{ name: 'id', dataType: 'int', isPrimaryKey: true }],
    getIndexes: async () => [{ name: 'pk', columns: ['id'] }],
    getSchemas: async () => ['public'],
    getDatabases: async () => ['app'],
  } as unknown as SchemaAccess
  const connections = {
    query: async (_id: string, sql: string) => ({
      rows: sql.includes('EXPLAIN') ? [{ plan: 'Seq Scan' }] : [{ id: 1 }, { id: 2 }],
      fields: [{ name: 'id', dataType: 'int' }],
      rowCount: 2, duration: 3,
    }),
    getProfile: () => ({ type: 'postgres', host: 'h', port: 5432, database: 'app', name: 'P' }),
  } as unknown as ConnectionAccess
  return { schema, connections }
}

describe('createDbTools', () => {
  it('exposes the six canonical tools with correct permissions', () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const byId = Object.fromEntries(tools.map(t => [t.id, t]))
    expect(Object.keys(byId).sort()).toEqual(
      ['connection_info', 'describe_table', 'explain_query', 'get_schemas', 'list_tables', 'query'].sort()
    )
    expect(byId.query.permission).toBe('write')
    expect(byId.explain_query.permission).toBe('read')
  })

  it('query returns rows + meta and truncates to the row limit', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 1)
    const query = tools.find(t => t.id === 'query')!
    const res = await query.execute({ sql: 'SELECT * FROM t' }, ctx)
    expect(res.success).toBe(true)
    expect((res.data as { rows: unknown[] }).rows).toHaveLength(1) // truncated
    expect((res.data as { rowCount: number }).rowCount).toBe(2)
  })

  it('list_tables / describe_table / connection_info read through access objects', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const list = await tools.find(t => t.id === 'list_tables')!.execute({}, ctx)
    expect((list.data as unknown[]).length).toBe(1)
    const desc = await tools.find(t => t.id === 'describe_table')!.execute({ table: 't' }, ctx)
    expect((desc.data as { columns: unknown[] }).columns).toHaveLength(1)
    const info = await tools.find(t => t.id === 'connection_info')!.execute({}, ctx)
    expect((info.data as { type: string }).type).toBe('postgres')
  })

  it('fails clearly with no active connection', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const res = await tools.find(t => t.id === 'list_tables')!
      .execute({}, { connectionId: null, abortSignal: new AbortController().signal })
    expect(res.success).toBe(false)
    expect(res.display).toMatch(/no active/i)
  })
})
