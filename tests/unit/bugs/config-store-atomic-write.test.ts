// Regression test for ConfigStore non-atomic disk writes.
//
// `save()` and `_persist()` both called `fs.writeFileSync(filePath, …)`.
// On a crash (or even an OS-level interruption) mid-write, the user's
// `config.json` was left half-written and unparseable on next launch —
// silently dropping every saved connection.
//
// The fix writes to a sibling temp file and atomically renames it onto
// the final path. The rename is atomic on POSIX (and `MoveFileEx` with
// `MOVEFILE_REPLACE_EXISTING` on Windows), so either the old file or
// the new file is observed by any concurrent reader / next launch —
// never a truncated mix.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ConfigStore } from '../../../src/main/config/store'
import type { ConnectionProfile } from '../../../shared/types'

let configPath: string

beforeEach(() => {
  configPath = path.join(os.tmpdir(), `nova-atomic-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
})

afterEach(() => {
  try { fs.unlinkSync(configPath) } catch { /* ignore */ }
  vi.restoreAllMocks()
})

describe('ConfigStore — atomic saves', () => {
  it('does not write directly to the final path during save', () => {
    const store = new ConfigStore(configPath)

    const writes: string[] = []
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation((p) => {
      writes.push(String(p))
    })
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {})

    const profile: ConnectionProfile = {
      id: 'p1', name: 'P1', type: 'sqlite', database: '/tmp/a.db',
    }
    store.saveConnection(profile)

    // Every write must target a sibling, not the final path.
    expect(writes.length).toBeGreaterThan(0)
    for (const w of writes) {
      expect(w).not.toBe(configPath)
      expect(path.dirname(w)).toBe(path.dirname(configPath))
    }
    writeSpy.mockRestore()
  })

  it('renames the temp file onto the final path (atomic publish)', () => {
    const store = new ConfigStore(configPath)

    const renames: Array<[string, string]> = []
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      renames.push([String(from), String(to)])
    })

    store.saveConnection({ id: 'p1', name: 'P1', type: 'sqlite', database: '/tmp/a.db' })

    expect(renames.length).toBeGreaterThan(0)
    for (const [, to] of renames) {
      expect(to).toBe(configPath)
    }
    writeSpy.mockRestore()
  })

  it('leaves the existing file untouched when the write throws mid-save', () => {
    // Prime the file with valid content.
    const store = new ConfigStore(configPath)
    store.saveConnection({ id: 'p1', name: 'P1', type: 'sqlite', database: '/tmp/a.db' })
    const before = fs.readFileSync(configPath, 'utf-8')

    // Now fake a crashed write mid-save: writeFileSync is called for the
    // temp path, throws, and rename never happens. The on-disk file must
    // still hold the previous good state.
    vi.spyOn(fs, 'writeFileSync').mockImplementation((p) => {
      throw new Error(`simulated disk full at ${p}`)
    })

    expect(() => store.saveConnection({
      id: 'p2', name: 'P2', type: 'sqlite', database: '/tmp/b.db',
    })).toThrow()

    const after = fs.readFileSync(configPath, 'utf-8')
    expect(after).toBe(before)
    expect(() => JSON.parse(after)).not.toThrow()
  })
})
