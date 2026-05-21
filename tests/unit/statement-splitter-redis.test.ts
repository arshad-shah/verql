import { describe, it, expect } from 'vitest'
import { splitRedisStatements } from '@/lib/statement-contributions/redis'

describe('splitRedisStatements', () => {
  it('returns empty for empty input', () => {
    expect(splitRedisStatements('')).toEqual([])
  })

  it('treats each non-empty line as a statement', () => {
    const r = splitRedisStatements('GET foo\nSET bar 1\nINCR counter')
    expect(r.map((s) => s.text)).toEqual(['GET foo', 'SET bar 1', 'INCR counter'])
    expect(r.map((s) => s.startLine)).toEqual([1, 2, 3])
  })

  it('skips comment lines and blank lines', () => {
    const r = splitRedisStatements('# header\n\nGET foo\n# another\nSET bar 1')
    expect(r.map((s) => s.text)).toEqual(['GET foo', 'SET bar 1'])
    expect(r.map((s) => s.startLine)).toEqual([3, 5])
  })

  it('captures full line range including end column', () => {
    const r = splitRedisStatements('GET foo')
    expect(r[0]).toMatchObject({ startLine: 1, startColumn: 1, endLine: 1, endColumn: 8 })
  })
})
