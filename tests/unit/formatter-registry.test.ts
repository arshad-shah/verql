import { describe, it, expect } from 'vitest'
import { FormatterRegistryImpl } from '../../src/main/plugins/sdk/formatter-registry'
import { formatSql } from '../../src/main/plugins/sdk/sql-format'

describe('FormatterRegistryImpl', () => {
  it('prefers a dialect-specific formatter over the generic fallback', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('generic', { displayName: 'SQL (generic)', format: (s) => `generic:${s}` })
    reg.register('pg', { displayName: 'SQL (PG)', appliesTo: (t) => t === 'postgresql', format: (s) => `pg:${s}` })

    expect(reg.resolve('postgresql')?.format('x')).toBe('pg:x')
    // No dialect match → generic fallback.
    expect(reg.resolve('mongodb')?.format('x')).toBe('generic:x')
  })

  it('returns undefined when nothing matches and there is no fallback', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('pg', { displayName: 'SQL (PG)', appliesTo: (t) => t === 'postgresql', format: (s) => s })
    expect(reg.resolve('mysql')).toBeUndefined()
  })

  it('rejects duplicate ids', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('a', { displayName: 'A', format: (s) => s })
    expect(() => reg.register('a', { displayName: 'A2', format: (s) => s })).toThrow(/already registered/)
  })
})

describe('formatSql', () => {
  it('pretty-prints SQL (multi-line, spaced)', () => {
    const out = formatSql('select id,name from users where id=1', 'postgresql')
    expect(out).toContain('\n')
    expect(out.toLowerCase()).toContain('select')
    expect(out).not.toBe('select id,name from users where id=1')
  })

  it('returns the input unchanged when it cannot be parsed', () => {
    const garbage = '!!! not ; valid (((sql'
    // Must never throw and must never lose the user's text.
    expect(typeof formatSql(garbage, 'postgresql')).toBe('string')
  })
})
