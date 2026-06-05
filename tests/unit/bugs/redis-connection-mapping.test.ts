// Regression test: the Redis driver factory must map connection-profile
// fields onto ioredis options.
//
// The factory previously did `new RedisAdapter(config)` — passing the whole
// profile as ioredis options and omitting the database arg. Effects:
//   - the `database` field was ignored → every connection used db0
//   - the `ssl` checkbox was never translated to ioredis's `tls` option →
//     a user who enabled SSL got a *plaintext* connection (silent downgrade)
//   - profile-only keys (id/name/type/ssl/database) leaked in as bogus opts
import { describe, it, expect } from 'vitest'
import { buildRedisConnection } from '../../../src/main/plugins/bundled/redis/redis-adapter'

describe('buildRedisConnection', () => {
  it('maps host/port/password', () => {
    const { options } = buildRedisConnection({
      host: 'cache.example.com', port: 6380, password: 'pw',
    })
    expect(options.host).toBe('cache.example.com')
    expect(options.port).toBe(6380)
    expect(options.password).toBe('pw')
  })

  it('carries the selected database instead of always db0', () => {
    expect(buildRedisConnection({ database: 5 }).database).toBe(5)
    expect(buildRedisConnection({}).database).toBe(0)
  })

  it('enables TLS when ssl is set (no silent plaintext downgrade)', () => {
    expect(buildRedisConnection({ ssl: true }).options.tls).toBeDefined()
    expect(buildRedisConnection({ ssl: false }).options.tls).toBeUndefined()
    expect(buildRedisConnection({}).options.tls).toBeUndefined()
  })

  it('does not leak profile-only keys into ioredis options', () => {
    const { options } = buildRedisConnection({
      id: 'p1', name: 'My Redis', type: 'redis', ssl: true, database: 3,
      host: 'h', port: 6379,
    })
    const opts = options as Record<string, unknown>
    expect(opts.id).toBeUndefined()
    expect(opts.name).toBeUndefined()
    expect(opts.type).toBeUndefined()
    expect(opts.ssl).toBeUndefined()
    expect(opts.database).toBeUndefined()
  })

  it('applies sane defaults when host/port are missing', () => {
    const { options } = buildRedisConnection({})
    expect(options.host).toBe('localhost')
    expect(options.port).toBe(6379)
  })
})
