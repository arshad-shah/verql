import { describe, it, expect } from 'vitest'
import { hashStatement } from '@/stores/statement-status'

describe('hashStatement', () => {
  it('is stable for identical input', () => {
    expect(hashStatement('SELECT 1')).toEqual(hashStatement('SELECT 1'))
  })

  it('ignores leading/trailing whitespace and outer-case', () => {
    expect(hashStatement('  SELECT 1  ')).toEqual(hashStatement('select 1'))
  })

  it('differs across distinct statements', () => {
    expect(hashStatement('SELECT 1')).not.toEqual(hashStatement('SELECT 2'))
  })
})
