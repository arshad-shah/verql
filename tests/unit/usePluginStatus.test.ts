import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePluginStatus } from '@/components/shell/status-bar/usePluginStatus'
import { useNotificationsStore } from '@/stores/notifications'
import { IPC_CHANNELS } from '@shared/ipc'

type PluginRow = { status: { state: string } }

function mockInvoke(rows: PluginRow[]) {
  const invoke = vi.fn(async (channel: string) => {
    if (channel === IPC_CHANNELS.PLUGINS_LIST) return rows
    return undefined
  })
  // @ts-expect-error mocked global
  globalThis.window.electronAPI = { invoke, on: vi.fn(() => () => {}) }
  return invoke
}

beforeEach(() => {
  useNotificationsStore.setState((s) => ({ ...s, notifications: [] }))
})
afterEach(() => vi.restoreAllMocks())

describe('usePluginStatus', () => {
  it('reports active + total counts after first poll', async () => {
    mockInvoke([
      { status: { state: 'active' } },
      { status: { state: 'active' } },
      { status: { state: 'error' } },
    ])
    const { result } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.active).toBe(2)
    expect(result.current.total).toBe(3)
    expect(result.current.failed).toBe(1)
  })

  it('reports loading=true while any plugin is in a transitional state', async () => {
    mockInvoke([
      { status: { state: 'activating' } },
      { status: { state: 'active' } },
    ])
    const { result } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(result.current.total).toBe(2))
    expect(result.current.loading).toBe(true)
  })

  it('fires a single notification across multiple poll ticks', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockInvoke([{ status: { state: 'error' } }])
    const { unmount } = renderHook(() => usePluginStatus())

    // First poll fires immediately on mount
    await vi.waitFor(() =>
      expect(useNotificationsStore.getState().notifications).toHaveLength(1)
    )

    // Advance past two more poll intervals
    await vi.advanceTimersByTimeAsync(4500)

    // Still exactly one notification despite repeated failures
    expect(useNotificationsStore.getState().notifications).toHaveLength(1)

    unmount()
    vi.useRealTimers()
  })
})
