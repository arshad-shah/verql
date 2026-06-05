// Security regression: the MCP bearer-token check must be constant-time.
//
// The original check used `auth !== \`Bearer ${token}\``, which short-circuits
// at the first differing byte and leaks how many leading bytes matched —
// allowing byte-by-byte recovery of the token by a local process (MCP's
// exact threat model: other local apps without the token). The fix uses
// crypto.timingSafeEqual, which also requires explicit handling of
// length-mismatched / missing headers (timingSafeEqual throws on unequal
// buffer lengths).
import { describe, it, expect } from 'vitest'
import { isValidBearer } from '../../../src/main/mcp/auth'

const TOKEN = 'a'.repeat(64)

describe('MCP isValidBearer (constant-time)', () => {
  it('accepts the exact bearer header', () => {
    expect(isValidBearer(`Bearer ${TOKEN}`, TOKEN)).toBe(true)
  })

  it('rejects a wrong token of the same length', () => {
    expect(isValidBearer(`Bearer ${'b'.repeat(64)}`, TOKEN)).toBe(false)
  })

  it('rejects a token of a different length without throwing', () => {
    expect(() => isValidBearer('Bearer short', TOKEN)).not.toThrow()
    expect(isValidBearer('Bearer short', TOKEN)).toBe(false)
  })

  it('rejects a missing or malformed header', () => {
    expect(isValidBearer(undefined, TOKEN)).toBe(false)
    expect(isValidBearer('', TOKEN)).toBe(false)
    expect(isValidBearer('Basic xxx', TOKEN)).toBe(false)
    expect(isValidBearer(TOKEN, TOKEN)).toBe(false) // no "Bearer " prefix
  })
})
