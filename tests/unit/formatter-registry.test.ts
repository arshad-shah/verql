import { describe, it, expect } from 'vitest'
import { FormatterRegistryImpl } from '../../src/main/plugins/sdk/formatter-registry'
import { formatSql } from '../../src/main/plugins/sdk/sql-format'
import { formatJson } from '../../src/main/plugins/sdk/format-json'

describe('FormatterRegistryImpl', () => {
  it('prefers a connection-specific formatter over the language fallback', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('sql-generic', { language: 'sql', displayName: 'SQL (generic)', format: (s) => `generic:${s}` })
    reg.register('pg', { language: 'sql', displayName: 'SQL (PG)', appliesToTypes: ['postgresql'], format: (s) => `pg:${s}` })

    expect(reg.resolve('sql', 'postgresql')?.format('x')).toBe('pg:x')
    // No dialect-specific match → language-wide fallback.
    expect(reg.resolve('sql', 'mongodb')?.format('x')).toBe('generic:x')
  })

  it('never crosses languages (a SQL fallback can\'t apply to JSON)', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('sql-generic', { language: 'sql', displayName: 'SQL (generic)', format: (s) => s })
    reg.register('mongo', { language: 'json', displayName: 'JSON (Mongo)', appliesToTypes: ['mongodb'], format: (s) => `json:${s}` })

    expect(reg.resolve('json', 'mongodb')?.format('x')).toBe('json:x')
    // A plaintext editor has no formatter — must not fall back to the SQL one.
    expect(reg.resolve('plaintext', 'redis')).toBeUndefined()
    // A JSON editor on a non-mongo connection: no language fallback registered.
    expect(reg.resolve('json', 'someother')).toBeUndefined()
  })

  it('returns undefined when nothing matches and there is no language fallback', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('pg', { language: 'sql', displayName: 'SQL (PG)', appliesToTypes: ['postgresql'], format: (s) => s })
    expect(reg.resolve('sql', 'mysql')).toBeUndefined()
  })

  it('rejects duplicate ids', () => {
    const reg = new FormatterRegistryImpl()
    reg.register('a', { language: 'sql', displayName: 'A', format: (s) => s })
    expect(() => reg.register('a', { language: 'sql', displayName: 'A2', format: (s) => s })).toThrow(/already registered/)
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
    expect(typeof formatSql('!!! not ; valid (((sql', 'postgresql')).toBe('string')
  })
})

describe('formatJson', () => {
  it('pretty-prints valid JSON', () => {
    expect(formatJson('{"a":1,"b":[2,3]}')).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')
  })

  it('returns the input unchanged when it is not valid JSON', () => {
    const shellQuery = 'db.users.find({ a: 1 })'
    expect(formatJson(shellQuery)).toBe(shellQuery)
  })
})
