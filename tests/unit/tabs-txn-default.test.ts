import { describe, it, expect } from 'vitest'
import { initialAutoCommit } from '../../src/renderer/src/lib/initial-autocommit'
import type { ConnectionProfile } from '../../shared/types'

const base = { id: 'c', name: 'c', type: 'postgresql', database: 'd', color: '#fff' } as ConnectionProfile

describe('initialAutoCommit', () => {
  it('defaults to true when the profile does not set it', () => {
    expect(initialAutoCommit(base)).toBe(true)
  })
  it('honors defaultAutoCommit:false', () => {
    expect(initialAutoCommit({ ...base, defaultAutoCommit: false })).toBe(false)
  })
  it('defaults to true for a null profile', () => {
    expect(initialAutoCommit(null)).toBe(true)
  })
})
