import { describe, it, expect } from 'vitest'
import { splitMongoStatements } from '@/lib/statement-contributions/mongodb'

describe('splitMongoStatements', () => {
  it('returns empty for empty input', () => {
    expect(splitMongoStatements('')).toEqual([])
  })

  it('emits one statement per balanced top-level brace group', () => {
    const src = '{"find":"users"}\n{"find":"orders"}'
    const r = splitMongoStatements(src)
    expect(r.map((s) => s.text)).toEqual(['{"find":"users"}', '{"find":"orders"}'])
    expect(r.map((s) => s.startLine)).toEqual([1, 2])
  })

  it('keeps a multi-line document as one statement', () => {
    const src = '{\n  "find": "users",\n  "limit": 10\n}'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(1)
    expect(r[0].startLine).toBe(1)
    expect(r[0].endLine).toBe(4)
  })

  it('treats two consecutive documents as separate even without blank line', () => {
    const src = '{ "a": 1 }{ "b": 2 }'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(2)
  })

  it('ignores braces inside string literals', () => {
    const src = '{ "x": "has } brace" }\n{ "y": 1 }'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(2)
  })
})
