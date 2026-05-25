import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDriverCapabilitiesStore } from '../../src/renderer/src/stores/driver-capabilities'

const invoke = vi.fn()
beforeEach(() => {
  invoke.mockReset()
  ;(globalThis as { window?: unknown }).window = { electronAPI: { invoke } }
  useDriverCapabilitiesStore.setState({ byType: {}, byConnection: {}, inflight: {} })
})

describe('resolveCapabilities', () => {
  it('returns static caps when no connection overlay is present', async () => {
    invoke.mockResolvedValueOnce({ hasSampleQuery: true, hasGetTableData: false, session: { autoCommit: true, manualTransactions: false } })
    await useDriverCapabilitiesStore.getState().fetch('postgresql')
    const caps = useDriverCapabilitiesStore.getState().resolveCapabilities('conn1', 'postgresql')
    expect(caps?.session?.manualTransactions).toBe(false)
  })

  it('overlays a per-connection runtime capability', async () => {
    invoke.mockResolvedValueOnce({ hasSampleQuery: true, hasGetTableData: false, session: { autoCommit: true, manualTransactions: false } })
    await useDriverCapabilitiesStore.getState().fetch('mongodb')
    invoke.mockResolvedValueOnce({ session: { manualTransactions: true } })
    await useDriverCapabilitiesStore.getState().fetchConnection('conn1', 'mongodb')
    const caps = useDriverCapabilitiesStore.getState().resolveCapabilities('conn1', 'mongodb')
    expect(caps?.session?.manualTransactions).toBe(true)
  })

  it('resolves static caps with a null profileId (no overlay applied)', async () => {
    invoke.mockResolvedValueOnce({ hasSampleQuery: true, hasGetTableData: false, session: { autoCommit: true, manualTransactions: true } })
    await useDriverCapabilitiesStore.getState().fetch('sqlite')
    const caps = useDriverCapabilitiesStore.getState().resolveCapabilities(null, 'sqlite')
    expect(caps?.session?.manualTransactions).toBe(true)
  })

  it('clears the connection overlay on disconnect', () => {
    useDriverCapabilitiesStore.setState({ byConnection: { conn1: { session: { manualTransactions: true } } } })
    useDriverCapabilitiesStore.getState().clearConnection('conn1')
    expect(useDriverCapabilitiesStore.getState().byConnection.conn1).toBeUndefined()
  })
})
