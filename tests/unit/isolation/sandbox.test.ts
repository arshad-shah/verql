// The worker module sandbox is what finally makes the "advisory" capabilities
// (network/filesystem/process) enforceable: inside an isolated plugin process,
// require() of a gated Node builtin throws unless the matching capability was
// granted. These tests pin the policy (blockedModules) and the live loader
// patch (installModuleSandbox).
import { describe, it, expect, afterEach } from 'vitest'
import Module from 'module'
import {
  blockedModules,
  installModuleSandbox,
  SandboxViolationError,
  FORBIDDEN_BY_PERMISSION,
} from '../../../src/main/plugins/isolation/sandbox'

describe('blockedModules', () => {
  it('blocks all gated builtins when nothing is granted', () => {
    const blocked = blockedModules([])
    expect(blocked.has('net')).toBe(true)
    expect(blocked.has('node:net')).toBe(true)
    expect(blocked.has('fs')).toBe(true)
    expect(blocked.has('fs/promises')).toBe(true)
    expect(blocked.has('child_process')).toBe(true)
  })

  it('leaves a builtin reachable when its owning permission is granted', () => {
    const blocked = blockedModules(['network'])
    expect(blocked.has('net')).toBe(false)
    expect(blocked.has('node:http')).toBe(false)
    // but other permission groups remain blocked
    expect(blocked.has('fs')).toBe(true)
    expect(blocked.has('child_process')).toBe(true)
  })

  it('grants compose independently', () => {
    const blocked = blockedModules(['network', 'process'])
    expect(blocked.has('net')).toBe(false)
    expect(blocked.has('child_process')).toBe(false)
    expect(blocked.has('fs')).toBe(true)
  })

  it('every gated module belongs to exactly one permission group', () => {
    const seen = new Set<string>()
    for (const mods of Object.values(FORBIDDEN_BY_PERMISSION)) {
      for (const m of mods) {
        expect(seen.has(m)).toBe(false)
        seen.add(m)
      }
    }
  })
})

describe('installModuleSandbox', () => {
  let restore: (() => void) | undefined
  afterEach(() => {
    restore?.()
    restore = undefined
  })

  it('throws SandboxViolationError on a blocked require, with the owning permission', () => {
    restore = installModuleSandbox([]) // no grants
    expect(() => (Module.prototype.require as (id: string) => unknown).call(module, 'net'))
      .toThrowError(SandboxViolationError)
    try {
      ;(Module.prototype.require as (id: string) => unknown).call(module, 'child_process')
    } catch (err) {
      expect((err as SandboxViolationError).permission).toBe('process')
    }
  })

  it('allows a granted builtin and still blocks an ungranted one', () => {
    restore = installModuleSandbox(['filesystem'])
    // fs is granted → loads fine
    expect(() => (Module.prototype.require as (id: string) => unknown).call(module, 'fs')).not.toThrow()
    // net is not → blocked
    expect(() => (Module.prototype.require as (id: string) => unknown).call(module, 'net'))
      .toThrowError(/net/)
  })

  it('is a no-op (no patch) when every permission is granted', () => {
    const before = Module.prototype.require
    restore = installModuleSandbox(['network', 'filesystem', 'process'])
    expect(Module.prototype.require).toBe(before)
  })

  it('restores the original loader on cleanup', () => {
    const before = Module.prototype.require
    const undo = installModuleSandbox([])
    expect(Module.prototype.require).not.toBe(before)
    undo()
    expect(Module.prototype.require).toBe(before)
  })
})
