// Regression tests for the MySQL field-flag → nullable mapping.
//
// The MySQL2 driver returns a `flags` bitfield on every FieldPacket. The
// NOT_NULL bit is bit 0 (value 1). The original implementation read it as
//
//   (f.flags ?? 0 & 1) === 0
//
// which, by JavaScript operator precedence (`&` binds tighter than `??`),
// silently parsed as `(f.flags ?? 0) === 0` — i.e. a column was reported
// `nullable` only when *every* flag was zero, ignoring the NOT_NULL bit.
// A column with PRIMARY_KEY (flag 2) or UNIQUE_KEY (flag 4) set but no
// NOT_NULL bit was therefore reported as NOT-nullable.
//
// We pin the correct behaviour by importing a pure helper and asserting
// the bit-level contract.
import { describe, it, expect } from 'vitest'
import { isNullableFromMysqlFlags } from '../../../src/main/plugins/bundled/mysql/mysql-adapter'

const NOT_NULL = 1
const PRI_KEY = 2
const UNIQUE_KEY = 4
const AUTO_INCREMENT = 512

describe('MySQL: isNullableFromMysqlFlags', () => {
  it('treats no-flags as nullable', () => {
    expect(isNullableFromMysqlFlags(0)).toBe(true)
  })

  it('treats undefined/null flags as nullable (mysql2 omits flags for some packets)', () => {
    expect(isNullableFromMysqlFlags(undefined)).toBe(true)
    expect(isNullableFromMysqlFlags(null as unknown as number)).toBe(true)
  })

  it('returns false when NOT_NULL bit is set', () => {
    expect(isNullableFromMysqlFlags(NOT_NULL)).toBe(false)
    expect(isNullableFromMysqlFlags(NOT_NULL | PRI_KEY)).toBe(false)
    expect(isNullableFromMysqlFlags(NOT_NULL | PRI_KEY | AUTO_INCREMENT)).toBe(false)
  })

  // These are the cases the buggy expression got wrong: a column may have
  // other bits set (UNIQUE_KEY, PRIMARY_KEY, etc.) without the NOT_NULL bit.
  // It should still report as nullable.
  it('returns true when only PRI_KEY is set (no NOT_NULL)', () => {
    expect(isNullableFromMysqlFlags(PRI_KEY)).toBe(true)
  })

  it('returns true when only UNIQUE_KEY is set (no NOT_NULL)', () => {
    expect(isNullableFromMysqlFlags(UNIQUE_KEY)).toBe(true)
  })

  it('returns true for flags=2 (the smallest regression case)', () => {
    // This is the regression that motivated the test: under the original
    // expression `(2 ?? 0 & 1) === 0` evaluated to `false`, reporting the
    // column as NOT nullable.
    expect(isNullableFromMysqlFlags(2)).toBe(true)
  })

  // mysql2 also emits `flags` as a string array of flag names in some
  // packet modes; the helper must handle both shapes.
  it('returns true when flags is an array without NOT_NULL', () => {
    expect(isNullableFromMysqlFlags(['PRI_KEY'])).toBe(true)
    expect(isNullableFromMysqlFlags([])).toBe(true)
  })

  it('returns false when flags array contains NOT_NULL', () => {
    expect(isNullableFromMysqlFlags(['NOT_NULL'])).toBe(false)
    expect(isNullableFromMysqlFlags(['NOT_NULL', 'PRI_KEY', 'AUTO_INCREMENT'])).toBe(false)
  })
})
