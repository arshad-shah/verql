import { describe, it, expect } from 'vitest'
import { parseMongoQuery, formatMongoResult } from '../../src/main/plugins/bundled/mongodb/mongo-adapter'

describe('parseMongoQuery', () => {
  it('parses a valid find query', () => {
    const q = parseMongoQuery('{ "collection": "users", "operation": "find", "filter": { "age": 25 }, "limit": 10 }')
    expect(q.collection).toBe('users')
    expect(q.operation).toBe('find')
    expect(q.filter).toEqual({ age: 25 })
    expect(q.limit).toBe(10)
  })

  it('parses an aggregate query', () => {
    const q = parseMongoQuery('{ "collection": "orders", "operation": "aggregate", "pipeline": [{ "$match": { "status": "A" } }] }')
    expect(q.collection).toBe('orders')
    expect(q.operation).toBe('aggregate')
    expect(q.pipeline).toEqual([{ '$match': { status: 'A' } }])
  })

  it('throws on invalid JSON', () => {
    expect(() => parseMongoQuery('not json')).toThrow(/Invalid query/)
  })

  it('throws on missing collection', () => {
    expect(() => parseMongoQuery('{ "operation": "find" }')).toThrow(/collection/)
  })

  it('throws on missing operation', () => {
    expect(() => parseMongoQuery('{ "collection": "users" }')).toThrow(/operation/)
  })

  it('throws on unknown operation', () => {
    expect(() => parseMongoQuery('{ "collection": "users", "operation": "drop" }')).toThrow(/Unknown operation/)
  })
})

describe('formatMongoResult', () => {
  it('formats an array of documents into QueryResult', () => {
    const docs = [
      { _id: '1', name: 'Alice', age: 30 },
      { _id: '2', name: 'Bob', age: 25 }
    ]
    const result = formatMongoResult(docs, 0)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ _id: '1', name: 'Alice', age: 30 })
    expect(result.fields).toHaveLength(3)
    expect(result.fields.map(f => f.name)).toEqual(['_id', 'name', 'age'])
    expect(result.rowCount).toBe(2)
  })

  it('handles empty result', () => {
    const result = formatMongoResult([], 0)
    expect(result.rows).toEqual([])
    expect(result.fields).toEqual([])
    expect(result.rowCount).toBe(0)
  })

  it('stringifies nested objects in cell values', () => {
    const docs = [{ _id: '1', address: { city: 'NYC', zip: '10001' } }]
    const result = formatMongoResult(docs, 0)
    expect(result.rows[0].address).toBe('{"city":"NYC","zip":"10001"}')
  })

  it('stringifies arrays in cell values', () => {
    const docs = [{ _id: '1', tags: ['a', 'b'] }]
    const result = formatMongoResult(docs, 0)
    expect(result.rows[0].tags).toBe('["a","b"]')
  })

  it('formats write operation result', () => {
    const writeResult = { insertedId: 'abc123' }
    const result = formatMongoResult(writeResult, 5)
    expect(result.affectedRows).toBe(5)
    expect(result.rows).toHaveLength(1)
  })
})
