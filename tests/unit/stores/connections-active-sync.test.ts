// Regression: switching the active connection in the renderer (e.g. picking
// another already-connected connection in the switcher) only updated the
// renderer store. The main process's active-connection — which AI tools and
// the MCP server read via getActiveConnectionId() — stayed pinned to the
// previous one, so the assistant operated on the wrong database. The store
// now mirrors every active change to main over db:set-active-connection.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const invokeMock = vi.fn()

beforeEach(() => {
  invokeMock.mockReset()
  invokeMock.mockResolvedValue(undefined)
  ;(window as unknown as { electronAPI: { invoke: typeof invokeMock; on: () => () => void } }).electronAPI = {
    invoke: invokeMock,
    on: () => () => {},
  }
})

describe('connections store — active connection sync to main', () => {
  it('pushes the active connection id to main when set', async () => {
    const { useConnectionsStore } = await import('../../../src/renderer/src/stores/connections')
    useConnectionsStore.getState().setActiveConnection('conn-b')

    expect(useConnectionsStore.getState().activeConnectionId).toBe('conn-b')
    expect(invokeMock).toHaveBeenCalledWith('db:set-active-connection', 'conn-b')
  })

  it('pushes null when the active connection is cleared', async () => {
    const { useConnectionsStore } = await import('../../../src/renderer/src/stores/connections')
    useConnectionsStore.getState().setActiveConnection(null)
    expect(invokeMock).toHaveBeenCalledWith('db:set-active-connection', null)
  })
})
