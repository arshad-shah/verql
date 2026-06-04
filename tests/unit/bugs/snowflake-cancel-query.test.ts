// Regression: SnowflakeAdapter.cancelQuery() ran
// SYSTEM$CANCEL_ALL_QUERIES(CURRENT_SESSION()), which aborts EVERY in-flight
// statement on the session — so cancelling the user's editor query would also
// kill concurrent background introspection queries. It now cancels exactly the
// active statement via the SDK's per-statement cancel().
import { describe, it, expect, vi } from 'vitest'
import { SnowflakeAdapter } from '../../../src/main/plugins/bundled/snowflake/snowflake-adapter'

type Adapter = SnowflakeAdapter & {
  connection: unknown
  activeStatement: { cancel: (cb: (err?: Error) => void) => void } | null
}

describe('SnowflakeAdapter.cancelQuery', () => {
  it('cancels only the active statement, not the whole session', async () => {
    const adapter = new SnowflakeAdapter({ account: 'a' }) as unknown as Adapter
    const cancel = vi.fn((cb: (err?: Error) => void) => cb())
    // A bogus connection.execute must NOT be used for cancellation.
    const execute = vi.fn()
    adapter.connection = { execute }
    adapter.activeStatement = { cancel }

    await (adapter as unknown as SnowflakeAdapter).cancelQuery()

    expect(cancel).toHaveBeenCalledOnce()
    // The old session-wide cancel path must be gone.
    expect(execute).not.toHaveBeenCalled()
  })

  it('is a no-op when no statement is active', async () => {
    const adapter = new SnowflakeAdapter({ account: 'a' }) as unknown as Adapter
    adapter.connection = { execute: vi.fn() }
    adapter.activeStatement = null
    await expect((adapter as unknown as SnowflakeAdapter).cancelQuery()).resolves.toBeUndefined()
  })
})
