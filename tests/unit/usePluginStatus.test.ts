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
  useNotificationsStore.setState({ notifications: [], unreadCount: 0 } as never)
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

  it('fires a single notification when failures are detected', async () => {
    mockInvoke([{ status: { state: 'error' } }])
    const add = vi.spyOn(useNotificationsStore.getState(), 'addNotification')
    const { rerender } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1))
    rerender()
    expect(add).toHaveBeenCalledTimes(1)
  })
})
