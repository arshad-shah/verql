// Regression: opts.timeoutMs was plumbed through IPC into every adapter's
// query() but no driver applied it — a runaway query hung the session with no
// bound. Postgres now sets a server-side statement_timeout on a dedicated
// client (and resets it before release); MySQL uses mysql2's per-query timeout.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Postgres ────────────────────────────────────────────────────────────────
const pgClientQueries: Array<{ text: unknown; params?: unknown }> = []
let pgClientReleased = false
const poolQueries: Array<{ text: unknown; params?: unknown }> = []

vi.mock('pg', () => {
  class Pool {
    constructor(_c: unknown) {}
    async connect() {
      pgClientReleased = false
      return {
        query: async (text: unknown, params?: unknown) => {
          pgClientQueries.push({ text, params })
          return { rows: [], fields: [], rowCount: 0 }
        },
        release: () => { pgClientReleased = true },
      }
    }
    async query(text: unknown, params?: unknown) {
      poolQueries.push({ text, params })
      return { rows: [], fields: [], rowCount: 0 }
    }
    async end() {}
  }
  return { default: { Pool }, Pool }
})

// ── MySQL ───────────────────────────────────────────────────────────────────
const mysqlQueryArgs: unknown[] = []
vi.mock('mysql2/promise', () => {
  return {
    default: {
      createPool: () => ({
        getConnection: async () => ({ release: () => {} }),
        query: async (...args: unknown[]) => { mysqlQueryArgs.push(args[0]); return [[], []] },
        end: async () => {},
      }),
    },
  }
})

import { PostgresAdapter } from '../../../src/main/plugins/bundled/postgresql/postgres-adapter'
import { MysqlAdapter } from '../../../src/main/plugins/bundled/mysql/mysql-adapter'

beforeEach(() => {
  pgClientQueries.length = 0
  poolQueries.length = 0
  mysqlQueryArgs.length = 0
  pgClientReleased = false
})

describe('Postgres query timeout', () => {
  it('sets and resets statement_timeout on a dedicated client when timeoutMs is given', async () => {
    const adapter = new PostgresAdapter({ database: 'db' })
    await adapter.connect()
    await adapter.query('SELECT pg_sleep(10)', [], { timeoutMs: 2000 })

    const texts = pgClientQueries.map(q => String(q.text))
    expect(texts).toContain('SET statement_timeout TO 2000')
    expect(texts).toContain('SELECT pg_sleep(10)')
    expect(texts).toContain('SET statement_timeout TO DEFAULT')
    // statement_timeout must be set before the query runs.
    expect(texts.indexOf('SET statement_timeout TO 2000')).toBeLessThan(texts.indexOf('SELECT pg_sleep(10)'))
    expect(pgClientReleased).toBe(true)
  })

  it('uses the pool directly (no timeout plumbing) when timeoutMs is absent', async () => {
    const adapter = new PostgresAdapter({ database: 'db' })
    await adapter.connect()
    await adapter.query('SELECT 1')
    expect(poolQueries.map(q => String(q.text))).toContain('SELECT 1')
    expect(pgClientQueries).toHaveLength(0)
  })
})

describe('MySQL query timeout', () => {
  it('passes a per-query timeout to mysql2 when timeoutMs is given', async () => {
    const adapter = new MysqlAdapter({ database: 'db' })
    await adapter.connect()
    await adapter.query('SELECT SLEEP(10)', ['p'], { timeoutMs: 1500 })

    const first = mysqlQueryArgs[0] as { sql?: string; timeout?: number; values?: unknown[] }
    expect(first.sql).toBe('SELECT SLEEP(10)')
    expect(first.timeout).toBe(1500)
    expect(first.values).toEqual(['p'])
  })

  it('uses the plain form when no timeout is given', async () => {
    const adapter = new MysqlAdapter({ database: 'db' })
    await adapter.connect()
    await adapter.query('SELECT 1')
    expect(mysqlQueryArgs[0]).toBe('SELECT 1')
  })
})
