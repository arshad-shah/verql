import { describe, it, expect } from 'vitest'
import { createServer } from 'http'
import { findFreePort } from '../../../src/main/mcp/find-port'

function occupy(port: number) {
  const s = createServer()
  return new Promise<() => void>((resolve) => {
    s.listen(port, '127.0.0.1', () => resolve(() => s.close()))
  })
}

describe('findFreePort', () => {
  it('returns the requested port when free', async () => {
    const got = await findFreePort(34567, 5)
    expect(got).toBe(34567)
  })

  it('skips an occupied port and finds the next free one', async () => {
    const release = await occupy(34570)
    try {
      const got = await findFreePort(34570, 5)
      expect(got).toBe(34571)
    } finally {
      release()
    }
  })

  it('throws when no port is free in range', async () => {
    const release = await occupy(34580)
    try {
      await expect(findFreePort(34580, 1)).rejects.toThrow(/no free port/i)
    } finally {
      release()
    }
  })
})
