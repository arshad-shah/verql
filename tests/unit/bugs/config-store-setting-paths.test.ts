// Regression tests for ConfigStore.setSetting / getSetting.
//
// These were extracted while auditing `src/main/config/store.ts` and lock down
// behaviours that affect security (prototype pollution) and stability
// (descending through non-object leaves) on a path that is reachable from the
// renderer via the `settings:set` IPC channel.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ConfigStore } from '../../../src/main/config/store'

let configPath: string
let store: ConfigStore

beforeEach(() => {
  configPath = path.join(os.tmpdir(), `nova-cfg-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  store = new ConfigStore(configPath)
})

afterEach(() => {
  try { fs.unlinkSync(configPath) } catch { /* ignore */ }
  // Clean up any pollution left from a failing assertion so later tests aren't poisoned.
  for (const key of ['polluted', 'isAdmin', 'polluted2']) {
    delete (Object.prototype as Record<string, unknown>)[key]
  }
})

describe('ConfigStore.setSetting — prototype pollution', () => {
  it('refuses to descend through __proto__', () => {
    expect(() => store.setSetting('__proto__.polluted', 'pwned')).toThrow()
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('refuses to descend through constructor.prototype', () => {
    expect(() => store.setSetting('constructor.prototype.isAdmin', true)).toThrow()
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined()
  })

  it('refuses to use prototype as an intermediate segment', () => {
    expect(() => store.setSetting('foo.prototype.polluted2', true)).toThrow()
    expect(({} as Record<string, unknown>).polluted2).toBeUndefined()
  })

  it('refuses to overwrite an inherited property even at a leaf', () => {
    // Setting the literal leaf `__proto__` would still be reaching at the
    // prototype chain on the next read; reject it.
    expect(() => store.setSetting('__proto__', 'pwned')).toThrow()
  })
})

describe('ConfigStore.setSetting — non-object intermediates', () => {
  it('throws a clear error rather than crashing the handler when descending into a string', () => {
    // Pretend a renderer first wrote a string at `appearance.theme` (it's
    // legitimately a string), then a later caller tries to set
    // `appearance.theme.shade` — the leaf is not an object, but we should
    // surface a clean message, not a generic TypeError that bubbles out of
    // the IPC handler with no actionable text.
    store.setSetting('appearance.theme', 'dark')
    expect(() => store.setSetting('appearance.theme.shade', 'light')).toThrow(
      /not an object|cannot descend|Cannot set/i,
    )
  })

  it('does not silently corrupt sibling keys when a path collides with a primitive', () => {
    store.setSetting('appearance.density', 'comfortable')
    try { store.setSetting('appearance.density.value', 'compact') } catch { /* expected */ }
    // The primitive must still be intact.
    expect(store.getSetting('appearance.density')).toBe('comfortable')
  })
})

describe('ConfigStore.setSetting — happy paths still work', () => {
  it('writes a top-level scalar', () => {
    store.setSetting('appearance.theme', 'midnight')
    expect(store.getSetting('appearance.theme')).toBe('midnight')
  })

  it('writes a nested scalar through a fresh object', () => {
    store.setSetting('experimental.feature.flag', true)
    expect(store.getSetting('experimental.feature.flag')).toBe(true)
  })
})
