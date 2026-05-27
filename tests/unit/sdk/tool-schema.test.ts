import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { isWriteQuery, toJsonSchema } from '../../../src/main/plugins/sdk/tool-schema'

describe('isWriteQuery', () => {
  it.each([
    'INSERT INTO t VALUES (1)',
    'update t set a=1',
    'DROP TABLE t',
    'TRUNCATE t',
  ])('flags %j as a write', (sql) => {
    expect(isWriteQuery(sql)).toBe(true)
  })
  it('passes pure reads', () => {
    expect(isWriteQuery('SELECT * FROM users')).toBe(false)
    expect(isWriteQuery('select 1')).toBe(false)
  })
  it('catches writes smuggled past a leading read or comment', () => {
    expect(isWriteQuery('SELECT 1; DROP TABLE users')).toBe(true)
    expect(isWriteQuery('/* hi */ DELETE FROM t')).toBe(true)
    expect(isWriteQuery('-- note\nUPDATE t SET a=1')).toBe(true)
  })
})

describe('toJsonSchema', () => {
  it('derives a JSON Schema object from a Zod object', () => {
    const schema = toJsonSchema(z.object({ sql: z.string().describe('the query') }))
    expect(schema.type).toBe('object')
    expect((schema.properties as Record<string, unknown>).sql).toBeDefined()
    expect(schema.required).toContain('sql')
  })
})
