// The RPC endpoint is the spine of the isolation bridge. These tests run two
// endpoints over the in-memory transport pair — exactly how host↔worker talk,
// minus the subprocess.
import { describe, it, expect } from 'vitest'
import { RpcEndpoint } from '../../../src/main/plugins/isolation/rpc'
import { createMemoryTransportPair } from '../../../src/main/plugins/isolation/memory-transport'

function pair() {
  const { host, worker } = createMemoryTransportPair()
  return { a: new RpcEndpoint(host), b: new RpcEndpoint(worker) }
}

describe('RpcEndpoint', () => {
  it('round-trips a request and response', async () => {
    const { a, b } = pair()
    b.handle('add', (params) => {
      const { x, y } = params as { x: number; y: number }
      return x + y
    })
    await expect(a.request('add', { x: 2, y: 3 })).resolves.toBe(5)
  })

  it('propagates a thrown error with its message', async () => {
    const { a, b } = pair()
    b.handle('boom', () => {
      throw new Error('kaboom')
    })
    await expect(a.request('boom', {})).rejects.toThrow('kaboom')
  })

  it('preserves a custom error field (e.g. permission) across the boundary', async () => {
    const { a, b } = pair()
    b.handle('denied', () => {
      const err = new Error('nope') as Error & { permission?: string }
      err.name = 'PermissionDeniedError'
      err.permission = 'keyring'
      throw err
    })
    await a.request('denied', {}).then(
      () => {
        throw new Error('should have rejected')
      },
      (err: Error & { permission?: string }) => {
        expect(err.name).toBe('PermissionDeniedError')
        expect(err.permission).toBe('keyring')
      },
    )
  })

  it('rejects when no handler is registered', async () => {
    const { a } = pair()
    await expect(a.request('missing', {})).rejects.toThrow(/No handler/)
  })

  it('delivers fire-and-forget events', async () => {
    const { a, b } = pair()
    const received: unknown[] = []
    b.on('ping', (p) => received.push(p))
    a.emit('ping', { n: 1 })
    await new Promise((r) => setTimeout(r, 5))
    expect(received).toEqual([{ n: 1 }])
  })

  it('rejects pending requests when the channel closes', async () => {
    const { a, b } = pair()
    b.handle('hang', () => new Promise(() => {})) // never resolves
    const p = a.request('hang', {})
    a.close()
    await expect(p).rejects.toThrow(/closed/)
  })

  it('times out a request with no response', async () => {
    const { host, worker } = createMemoryTransportPair()
    const a = new RpcEndpoint(host, { timeoutMs: 20 })
    new RpcEndpoint(worker).handle('slow', () => new Promise((r) => setTimeout(() => r('late'), 100)))
    await expect(a.request('slow', {})).rejects.toThrow(/timed out/)
  })
})
