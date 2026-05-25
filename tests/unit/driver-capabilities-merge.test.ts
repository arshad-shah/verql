// tests/unit/driver-capabilities-merge.test.ts
import { describe, it, expect } from 'vitest'
import { mergeCapabilities } from '../../shared/driver-capabilities'
import type { DriverCapabilities } from '../../shared/driver-capabilities'

const base: DriverCapabilities = {
  hasSampleQuery: true,
  hasGetTableData: true,
  session: { autoCommit: true, manualTransactions: false },
  sessionInspection: { canKill: false },
}

describe('mergeCapabilities', () => {
  it('returns base unchanged when overlay is null', () => {
    expect(mergeCapabilities(base, null)).toEqual(base)
  })

  it('overlays declared session fields', () => {
    const merged = mergeCapabilities(base, { session: { manualTransactions: true } })
    expect(merged.session?.manualTransactions).toBe(true)
    expect(merged.session?.autoCommit).toBe(true) // untouched
  })

  it('overlays sessionInspection.canKill', () => {
    const merged = mergeCapabilities(base, { sessionInspection: { canKill: true } })
    expect(merged.sessionInspection?.canKill).toBe(true)
  })

  it('is a no-op for a block the driver never declared', () => {
    const noSession: DriverCapabilities = { hasSampleQuery: false, hasGetTableData: false }
    const merged = mergeCapabilities(noSession, { session: { manualTransactions: true } })
    expect(merged.session).toBeUndefined()
  })

  it('does not mutate the base object', () => {
    mergeCapabilities(base, { session: { manualTransactions: true } })
    expect(base.session?.manualTransactions).toBe(false)
  })
})
