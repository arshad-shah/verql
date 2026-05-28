import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAIStore } from '@/stores/ai'

describe('useAIStore.permissionProfile', () => {
  const invokeMock = vi.fn()
  beforeEach(() => {
    invokeMock.mockReset()
    ;(window as unknown as { electronAPI: { invoke: typeof invokeMock; on: () => () => void } }).electronAPI = {
      invoke: invokeMock,
      on: () => () => {},
    }
    useAIStore.setState({ permissionProfile: 'ask-write' })
  })

  it('defaults to ask-write', () => {
    expect(useAIStore.getState().permissionProfile).toBe('ask-write')
  })

  it('loadPermissionProfile fetches from the plugin and stores it', async () => {
    invokeMock.mockResolvedValueOnce('auto')
    await useAIStore.getState().loadPermissionProfile()
    expect(invokeMock).toHaveBeenCalledWith('ai:permission:get-profile')
    expect(useAIStore.getState().permissionProfile).toBe('auto')
  })

  it('setPermissionProfile writes through the plugin then updates local state', async () => {
    invokeMock.mockResolvedValueOnce(undefined)
    await useAIStore.getState().setPermissionProfile('read-only')
    expect(invokeMock).toHaveBeenCalledWith('ai:permission:set-profile', 'read-only')
    expect(useAIStore.getState().permissionProfile).toBe('read-only')
  })
})
