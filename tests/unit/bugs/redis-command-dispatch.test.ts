// Regression test for the Redis adapter's command dispatcher.
//
// The old `query()` did
//
//   const value = await (this.client as ...)[cmd.toLowerCase()](...args)
//
// — a raw bracket access on the client. Two failure modes:
//   1. Any inherited method from Object.prototype/EventEmitter (`toString`,
//      `valueOf`, `hasOwnProperty`, `on`, `addListener`, …) was reachable,
//      so typing `toString` in the SQL editor returned `[object Object]`
//      instead of an "unknown Redis command" error.
//   2. Calling a builder-style method (`constructor`, `pipeline`) threw a
//      raw JS error with no Redis context, confusing users.
//
// ioredis exposes `client.call(cmd, ...args)` which routes through the
// Redis command parser and returns proper "ERR unknown command" replies.
// We assert the adapter uses that path.
import { describe, it, expect, beforeEach } from 'vitest'
import { RedisAdapter } from '../../../src/main/plugins/bundled/redis/redis-adapter'

interface FakeClient {
  callLog: Array<{ cmd: string; args: unknown[] }>
  call(cmd: string, ...args: unknown[]): Promise<unknown>
  status: string
  // Object.prototype-inherited methods must NOT be reachable through the
  // dispatcher, even though they exist on the instance via inheritance.
  toString(): string
}

function fakeClient(): FakeClient {
  return {
    callLog: [],
    status: 'ready',
    call(cmd: string, ...args: unknown[]) {
      this.callLog.push({ cmd, args })
      if (cmd.toLowerCase() === 'get' && args[0] === 'foo') return Promise.resolve('bar')
      if (cmd.toLowerCase() === 'ping') return Promise.resolve('PONG')
      // Mimic ioredis: unknown commands reject with an ERR reply.
      return Promise.reject(new Error(`ERR unknown command '${cmd}'`))
    },
    toString() { return '[object FakeClient]' },
  }
}

function makeAdapter(client: FakeClient): RedisAdapter {
  const adapter = new RedisAdapter({}, 0)
  // The adapter only constructs its client inside connect(); for the unit
  // test we install our fake directly via the private field.
  ;(adapter as unknown as { client: unknown }).client = client
  return adapter
}

describe('RedisAdapter.query — dispatcher', () => {
  let client: FakeClient
  let adapter: RedisAdapter

  beforeEach(() => {
    client = fakeClient()
    adapter = makeAdapter(client)
  })

  it('routes known commands through client.call', async () => {
    const result = await adapter.query('GET foo')
    expect(client.callLog).toEqual([{ cmd: 'GET', args: ['foo'] }])
    expect(result.rows).toEqual([{ value: 'bar' }])
  })

  it('rejects Object.prototype-inherited methods with an ERR unknown command', async () => {
    await expect(adapter.query('toString')).rejects.toThrow(/unknown command/i)
    // The fake records EVERY call.call() so we can verify dispatch did not
    // sidestep the parser by reaching into the inherited method directly.
    expect(client.callLog.map(c => c.cmd.toLowerCase())).toEqual(['tostring'])
  })

  it('rejects unknown commands with the redis error', async () => {
    await expect(adapter.query('NOPE')).rejects.toThrow(/unknown command/i)
  })

  it('handles multi-line scripts by calling client.call for each line', async () => {
    await adapter.query('PING\nGET foo')
    expect(client.callLog).toEqual([
      { cmd: 'PING', args: [] },
      { cmd: 'GET', args: ['foo'] },
    ])
  })
})
