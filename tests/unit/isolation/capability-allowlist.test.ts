// Security regression: the worker→host capability dispatcher must allowlist
// METHOD names, not just surfaces.
//
// The dispatcher resolves `ctx[surface][method]` with a fully
// worker-controlled `method` and calls it if it's a function. With only a
// surface allowlist, a hostile/compromised worker could send
// `method: 'constructor'` / 'hasOwnProperty' / 'valueOf' — all functions on
// the guarded context objects — and invoke inherited members with attacker
// args, escaping the documented capability surface and sidestepping the
// per-method permission guards.
import { describe, it, expect } from 'vitest'
import { isAllowedCapability } from '../../../src/main/plugins/isolation/isolated-plugin'

describe('isolated capability allowlist', () => {
  it('permits exactly the forwarded methods', () => {
    expect(isAllowedCapability('connections', 'query')).toBe(true)
    expect(isAllowedCapability('connections', 'cancelQuery')).toBe(true)
    expect(isAllowedCapability('keyring', 'store')).toBe(true)
    expect(isAllowedCapability('keyring', 'retrieve')).toBe(true)
    expect(isAllowedCapability('keyring', 'delete')).toBe(true)
    expect(isAllowedCapability('schema', 'getTables')).toBe(true)
    expect(isAllowedCapability('schema', 'getSchemaSummary')).toBe(true)
    expect(isAllowedCapability('settings', 'set')).toBe(true)
  })

  it('rejects inherited Object/prototype members (the escape vector)', () => {
    for (const surface of ['connections', 'keyring', 'schema', 'settings']) {
      expect(isAllowedCapability(surface, 'constructor')).toBe(false)
      expect(isAllowedCapability(surface, '__proto__')).toBe(false)
      expect(isAllowedCapability(surface, 'hasOwnProperty')).toBe(false)
      expect(isAllowedCapability(surface, 'valueOf')).toBe(false)
      expect(isAllowedCapability(surface, 'toString')).toBe(false)
    }
  })

  it('rejects sync/un-forwarded methods and unknown surfaces', () => {
    // These exist on the host context but must not cross the boundary.
    expect(isAllowedCapability('keyring', 'retrieveSync')).toBe(false)
    expect(isAllowedCapability('keyring', 'listKeys')).toBe(false)
    expect(isAllowedCapability('connections', 'getProfile')).toBe(false)
    expect(isAllowedCapability('settings', 'get')).toBe(false)
    expect(isAllowedCapability('drivers', 'register')).toBe(false)
    expect(isAllowedCapability('nope', 'query')).toBe(false)
  })
})
