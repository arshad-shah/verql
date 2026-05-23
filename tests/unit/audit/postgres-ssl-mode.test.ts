// Regression test for silent SSL certificate-verification bypass.
//
// The original pg adapter built `ssl: { rejectUnauthorized: false }` whenever
// the user enabled SSL, which meant every "encrypted" connection silently
// accepted any certificate the server presented — including a MITM attacker
// on the path. The fix introduces an explicit `sslMode` field:
//   - omitted / 'verify-full' → rejectUnauthorized: true (strict, default)
//   - 'no-verify'             → rejectUnauthorized: false (opt-in only)
//
// We pin the wire format and the default behaviour so a future refactor
// can't quietly re-enable the bypass.
import { describe, it, expect, vi } from 'vitest'

vi.mock('pg', () => {
  class Pool {
    config: unknown
    constructor(config: unknown) { this.config = config }
    async connect() { return { release: () => {} } }
    async query() { return { rows: [], fields: [], rowCount: 0 } }
    async end() {}
  }
  return { default: { Pool }, Pool }
})

import { PostgresAdapter } from '../../../src/main/plugins/bundled/postgresql/postgres-adapter'

function sslOptionFor(config: Record<string, unknown>): unknown {
  const adapter = new PostgresAdapter(config)
  return (adapter as unknown as { config: { ssl: unknown } }).config.ssl
}

describe('PostgresAdapter — SSL configuration', () => {
  it('disables SSL entirely when ssl is falsy', () => {
    expect(sslOptionFor({ database: 'db' })).toBe(false)
    expect(sslOptionFor({ database: 'db', ssl: false })).toBe(false)
  })

  it('verifies certificates by default when SSL is enabled', () => {
    const ssl = sslOptionFor({ database: 'db', ssl: true })
    expect(ssl).toEqual({ rejectUnauthorized: true })
  })

  it("verifies certificates when sslMode is 'verify-full'", () => {
    const ssl = sslOptionFor({ database: 'db', ssl: true, sslMode: 'verify-full' })
    expect(ssl).toEqual({ rejectUnauthorized: true })
  })

  it("verifies certificates when sslMode is 'require'", () => {
    const ssl = sslOptionFor({ database: 'db', ssl: true, sslMode: 'require' })
    expect(ssl).toEqual({ rejectUnauthorized: true })
  })

  it("only skips verification when sslMode is explicitly 'no-verify'", () => {
    const ssl = sslOptionFor({ database: 'db', ssl: true, sslMode: 'no-verify' })
    expect(ssl).toEqual({ rejectUnauthorized: false })
  })

  it('ignores sslMode when SSL itself is disabled', () => {
    // sslMode must never re-enable SSL on its own — the explicit `ssl: false`
    // wins, otherwise users could turn on insecure transport by setting only
    // the mode and forgetting the on/off switch.
    const ssl = sslOptionFor({ database: 'db', ssl: false, sslMode: 'no-verify' })
    expect(ssl).toBe(false)
  })
})
