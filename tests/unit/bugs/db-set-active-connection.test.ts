// Regression (main side): db:set-active-connection must update the shared
// ConnectionAccessImpl so AI/MCP target the connection the user switched to —
// but only for connections that are actually open (a stale id shouldn't point
// the tools at a dead adapter). null always clears.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { IpcChannelMap } from '../../../shared/ipc'
import type { DbAdapter } from '../../../src/main/db/adapter'
import type { IpcContext } from '../../../src/main/ipc/context'
import { registerDbHandlers } from '../../../src/main/ipc/db'
import { ConnectionAccessImpl } from '../../../src/main/plugins/sdk/connection-access'
import { DriverRegistryImpl } from '../../../src/main/plugins/sdk/driver-registry'
import { setDriverRegistry } from '../../../src/main/db/factory'

function buildHarness() {
  const handlers = new Map<string, (...a: unknown[]) => unknown>()
  const handle = ((channel: string, fn: (...a: unknown[]) => unknown) => {
    handlers.set(channel, fn)
  }) as unknown as Parameters<typeof registerDbHandlers>[1]

  const driverRegistry = new DriverRegistryImpl()
  setDriverRegistry(driverRegistry)

  const activeAdapters = new Map<string, DbAdapter>()
  const ctx = {
    configStore: { getConnection: () => undefined },
    keyring: {},
    driverRegistry,
    activeAdapters,
  } as unknown as IpcContext

  const connAccess = new ConnectionAccessImpl(
    (id) => activeAdapters.get(id),
    () => undefined,
  )
  registerDbHandlers(ctx, handle, connAccess)

  const invoke = (<K extends keyof IpcChannelMap>(channel: K, ...args: IpcChannelMap[K]['args']) => {
    const fn = handlers.get(channel)
    if (!fn) throw new Error(`No handler for ${channel}`)
    return Promise.resolve(fn(...args))
  }) as <K extends keyof IpcChannelMap>(channel: K, ...args: IpcChannelMap[K]['args']) => Promise<IpcChannelMap[K]['return']>

  return { invoke, connAccess, activeAdapters }
}

afterEach(() => setDriverRegistry(new DriverRegistryImpl()))

describe('db:set-active-connection', () => {
  it('updates the shared active connection for an open connection', async () => {
    const { invoke, connAccess, activeAdapters } = buildHarness()
    activeAdapters.set('conn-b', {} as DbAdapter)

    await invoke('db:set-active-connection', 'conn-b')
    expect(connAccess.getActiveConnectionId()).toBe('conn-b')
  })

  it('ignores ids for connections that are not open', async () => {
    const { invoke, connAccess } = buildHarness()
    await invoke('db:set-active-connection', 'not-open')
    expect(connAccess.getActiveConnectionId()).toBeNull()
  })

  it('always allows clearing to null', async () => {
    const { invoke, connAccess, activeAdapters } = buildHarness()
    activeAdapters.set('conn-a', {} as DbAdapter)
    await invoke('db:set-active-connection', 'conn-a')
    expect(connAccess.getActiveConnectionId()).toBe('conn-a')

    await invoke('db:set-active-connection', null)
    expect(connAccess.getActiveConnectionId()).toBeNull()
  })
})
