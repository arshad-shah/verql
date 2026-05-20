import { describe, it, expect } from 'vitest'
import {
  quoteIdentifier,
  validateIdentifier,
  IdentifierError
} from '../../src/main/db/identifier'

describe('validateIdentifier', () => {
  it('accepts ordinary table/column names', () => {
    expect(() => validateIdentifier('users')).not.toThrow()
    expect(() => validateIdentifier('user_profiles_2024')).not.toThrow()
    expect(() => validateIdentifier('FooBar')).not.toThrow()
    expect(() => validateIdentifier('_internal')).not.toThrow()
    expect(() => validateIdentifier('with space')).not.toThrow() // legal when quoted
  })

  it('accepts unicode identifiers (Postgres allows them)', () => {
    expect(() => validateIdentifier('café')).not.toThrow()
    expect(() => validateIdentifier('日本語')).not.toThrow()
  })

  it('rejects empty identifiers', () => {
    expect(() => validateIdentifier('')).toThrow(IdentifierError)
  })

  it('rejects identifiers > 255 chars (DoS guard)', () => {
    expect(() => validateIdentifier('a'.repeat(256))).toThrow(IdentifierError)
  })

  it('rejects identifiers containing NULL bytes', () => {
    expect(() => validateIdentifier('users\0DROP')).toThrow(IdentifierError)
  })

  it('rejects identifiers with newlines / carriage returns / tabs', () => {
    expect(() => validateIdentifier('users\n')).toThrow(IdentifierError)
    expect(() => validateIdentifier('users\r')).toThrow(IdentifierError)
    expect(() => validateIdentifier('users\t')).toThrow(IdentifierError)
  })

  it('rejects non-strings', () => {
    expect(() => validateIdentifier(null as unknown as string)).toThrow(IdentifierError)
    expect(() => validateIdentifier(undefined as unknown as string)).toThrow(IdentifierError)
    expect(() => validateIdentifier(123 as unknown as string)).toThrow(IdentifierError)
  })
})

describe('quoteIdentifier - postgres dialect', () => {
  it('wraps in double quotes', () => {
    expect(quoteIdentifier('users', 'postgresql')).toBe('"users"')
  })

  it('escapes embedded double quotes', () => {
    expect(quoteIdentifier('weird"name', 'postgresql')).toBe('"weird""name"')
  })

  it('neutralizes injection: a close-quote in the name is escaped, not interpreted', () => {
    const safe = quoteIdentifier('users"; DROP TABLE x; --', 'postgresql')
    expect(safe).toBe('"users""; DROP TABLE x; --"')
  })

  it('still rejects null bytes / newlines after escaping', () => {
    expect(() => quoteIdentifier('a\nb', 'postgresql')).toThrow(IdentifierError)
    expect(() => quoteIdentifier('a\0b', 'postgresql')).toThrow(IdentifierError)
  })
})

describe('quoteIdentifier - mysql dialect', () => {
  it('wraps in backticks', () => {
    expect(quoteIdentifier('users', 'mysql')).toBe('`users`')
  })

  it('escapes embedded backticks', () => {
    expect(quoteIdentifier('bad`name', 'mysql')).toBe('`bad``name`')
  })

  it('neutralizes backtick injection attempt', () => {
    const safe = quoteIdentifier('users`; DROP TABLE x; --', 'mysql')
    expect(safe).toBe('`users``; DROP TABLE x; --`')
  })
})

describe('quoteIdentifier - sqlite dialect', () => {
  it('wraps in double quotes (same as postgres)', () => {
    expect(quoteIdentifier('users', 'sqlite')).toBe('"users"')
  })

  it('escapes embedded double quotes', () => {
    expect(quoteIdentifier('foo"bar', 'sqlite')).toBe('"foo""bar"')
  })
})

describe('quoteIdentifier - qualified names', () => {
  it('supports schema.table by quoting each part separately', () => {
    expect(quoteIdentifier(['public', 'users'], 'postgresql'))
      .toBe('"public"."users"')
    expect(quoteIdentifier(['mydb', 'users'], 'mysql'))
      .toBe('`mydb`.`users`')
  })

  it('validates every part', () => {
    expect(() => quoteIdentifier(['public', 'a\nb'], 'postgresql'))
      .toThrow(IdentifierError)
  })
})

describe('quoteIdentifier - unknown dialect', () => {
  it('throws for unknown dialect rather than guessing', () => {
    expect(() => quoteIdentifier('users', 'oracle' as never)).toThrow(IdentifierError)
  })
})
