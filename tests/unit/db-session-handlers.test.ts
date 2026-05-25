import { describe, it, expect, vi } from 'vitest'
import { registerDbHandlers } from '../../src/main/ipc/db'

// Capture handlers registered via `handle(channel, fn)`.
function harness(adapter: Record<string, unknown>) {
  const handlers = new Map<string, (...a: unknown[]) => unknown>()
  const handle = ((ch: string, fn: (...a: unknown[]) => unknown) => handlers.set(ch, fn)) as never
  const ctx = {
    activeAdapters: new Map([['p1', adapter]]),
    driverRegistry: { get: () => undefined, getMiddlewares: () => [] },
    configStore: { getConnection: () => null },
  } as never
  const connectionAccess = { setActiveConnectionId() {}, getActiveConnectionId: () => null } as never
  registerDbHandlers(ctx, handle, connectionAccess)
  return handlers
}

describe('session/txn handlers', () => {
  it('db:txn:begin forwards to adapter.beginTransaction with sessionId + opts', async () => {
    const adapter = { beginTransaction: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:txn:begin')!('p1', 's1', { isolationLevel: 'SERIALIZABLE' })
    expect(adapter.beginTransaction).toHaveBeenCalledWith('s1', { isolationLevel: 'SERIALIZABLE' })
  })

  it('db:session:set-autocommit forwards enabled flag', async () => {
    const adapter = { setAutoCommit: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:session:set-autocommit')!('p1', 's1', false)
    expect(adapter.setAutoCommit).toHaveBeenCalledWith('s1', false)
  })

  it('db:txn:commit is a no-op when adapter lacks commit()', async () => {
    const h = harness({})
    await expect(h.get('db:txn:commit')!('p1', 's1')).resolves.toBeUndefined()
  })

  it('db:query forwards opts (sessionId) to adapter.query', async () => {
    const adapter = { query: vi.fn(async () => ({ rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 })) }
    const h = harness(adapter)
    await h.get('db:query')!('p1', 'SELECT 1', [], { sessionId: 's1' })
    expect(adapter.query).toHaveBeenCalledWith('SELECT 1', [], { sessionId: 's1' })
  })

  it('db:session:open forwards sessionId + opts to adapter.openSession', async () => {
    const adapter = { openSession: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:session:open')!('p1', 's1', { autoCommit: false })
    expect(adapter.openSession).toHaveBeenCalledWith('s1', { autoCommit: false })
  })

  it('db:session:open is a no-op when adapter lacks openSession()', async () => {
    const h = harness({})
    await expect(h.get('db:session:open')!('p1', 's1', { autoCommit: false })).resolves.toBeUndefined()
  })

  it('db:session:set-autocommit forwards enabled:true too', async () => {
    const adapter = { setAutoCommit: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:session:set-autocommit')!('p1', 's1', true)
    expect(adapter.setAutoCommit).toHaveBeenCalledWith('s1', true)
  })

  it('db:txn:rollback is tolerant when the adapter was already disconnected', async () => {
    const handlers = (() => {
      const map = new Map<string, (...a: unknown[]) => unknown>()
      const handle = ((ch: string, fn: (...a: unknown[]) => unknown) => map.set(ch, fn)) as never
      const ctx = {
        activeAdapters: new Map(), // no adapter for p1 — simulates post-disconnect
        driverRegistry: { get: () => undefined, getMiddlewares: () => [] },
        configStore: { getConnection: () => null },
      } as unknown as never
      const connectionAccess = { setActiveConnectionId() {}, getActiveConnectionId: () => null } as never
      registerDbHandlers(ctx, handle, connectionAccess)
      return map
    })()
    await expect(handlers.get('db:txn:rollback')!('p1', 's1')).resolves.toBeUndefined()
  })
})
