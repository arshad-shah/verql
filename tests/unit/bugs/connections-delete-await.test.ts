// Regression test for `connections:delete` not awaiting `disconnect()`.
//
// The handler in `src/main/ipc/connections.ts` called `adapter.disconnect()`
// without `await`, then immediately removed the profile from the on-disk
// config. If the adapter raised asynchronously, it became an unhandled
// rejection; if the user then re-created the same profile, a slow
// disconnect could still be holding the underlying socket/pool while
// the new adapter was opening one.
//
// We pin: the handler waits for disconnect() before completing.
import { describe, it, expect } from 'vitest'
import type { IpcChannelMap } from '../../../shared/ipc'
import type { DbAdapter } from '../../../src/main/db/adapter'
import type { IpcContext } from '../../../src/main/ipc/context'
import { registerConnectionHandlers } from '../../../src/main/ipc/connections'
import { DriverRegistryImpl } from '../../../src/main/plugins/sdk/driver-registry'

class SlowDisconnectAdapter implements DbAdapter {
  disconnectedAt: number | null = null
  disconnectStartedAt: number | null = null
  disconnectError: Error | null = null
  async connect(): Promise<void> { /* noop */ }
  async disconnect(): Promise<void> {
    this.disconnectStartedAt = Date.now()
    await new Promise(r => setTimeout(r, 30))
    this.disconnectedAt = Date.now()
    if (this.disconnectError) throw this.disconnectError
  }
  isConnected(): boolean { return false }
  async testConnection() { return { version: 'stub' } }
  async query() { return { rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 } }
  async getTables() { return [] }
  async getColumns() { return [] }
  async getIndexes() { return [] }
  async getRowCount() { return 0 }
  async getSchemas() { return [] }
  async getDatabases() { return [] }
  async switchDatabase() { /* noop */ }
}

function buildHarness(adapter: DbAdapter): {
  invoke: <K extends keyof IpcChannelMap>(channel: K, ...args: IpcChannelMap[K]['args']) => Promise<IpcChannelMap[K]['return']>
  configDeletedAt: () => number | null
} {
  const handlers = new Map<string, (...a: unknown[]) => unknown>()
  const handle = ((channel: string, fn: (...a: unknown[]) => unknown) => {
    handlers.set(channel, fn)
  }) as unknown as Parameters<typeof registerConnectionHandlers>[1]

  let configDeletedAt: number | null = null
  const ctx: IpcContext = {
    configStore: {
      listConnections: () => [],
      getConnection: () => undefined,
      saveConnection: (p: unknown) => p,
      deleteConnection: async () => { configDeletedAt = Date.now() },
    } as unknown as IpcContext['configStore'],
    keyring: {} as IpcContext['keyring'],
    driverRegistry: new DriverRegistryImpl(),
    activeAdapters: new Map([['p1', adapter]]),
  }
  registerConnectionHandlers(ctx, handle)
  return {
    configDeletedAt: () => configDeletedAt,
    invoke: ((channel, ...args) => {
      const fn = handlers.get(channel)
      if (!fn) throw new Error(`No handler for ${channel}`)
      return Promise.resolve(fn(...args))
    }) as ReturnType<typeof buildHarness>['invoke'],
  }
}

describe('connections:delete — awaits adapter.disconnect() before completing', () => {
  it('does not resolve until disconnect() has settled', async () => {
    const adapter = new SlowDisconnectAdapter()
    const { invoke, configDeletedAt } = buildHarness(adapter)

    await invoke('connections:delete', 'p1')

    // By the time the handler resolves, disconnect must already be done.
    expect(adapter.disconnectedAt).not.toBeNull()
    // And the on-disk delete must not have happened before disconnect started.
    expect(configDeletedAt()).not.toBeNull()
    expect(configDeletedAt()!).toBeGreaterThanOrEqual(adapter.disconnectedAt!)
  })

  it('surfaces disconnect errors rather than turning them into unhandled rejections', async () => {
    const adapter = new SlowDisconnectAdapter()
    adapter.disconnectError = new Error('socket closed unexpectedly')
    const { invoke } = buildHarness(adapter)
    await expect(invoke('connections:delete', 'p1')).rejects.toThrow(/socket closed unexpectedly/)
  })
})
