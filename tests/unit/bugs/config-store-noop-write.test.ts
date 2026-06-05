// #9 mitigation: ConfigStore.setSetting writes the whole connections+settings
// file synchronously on every call. The renderer already coalesces the only
// high-frequency source (layout drags persist on drag-end via draft state), so
// the remaining safe win is to skip the disk write + listener notification when
// a setting is re-applied to the value it already has.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ConfigStore } from '../../../src/main/config/store'

let configPath: string
let store: ConfigStore

beforeEach(() => {
  configPath = path.join(os.tmpdir(), `verql-noop-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  store = new ConfigStore(configPath)
})
afterEach(() => {
  try { fs.unlinkSync(configPath) } catch { /* ignore */ }
  vi.restoreAllMocks()
})

describe('ConfigStore.setSetting — no-op writes', () => {
  it('does not write to disk or notify when the value is unchanged', () => {
    store.setSetting('appearance.theme', 'midnight')

    const writeSpy = vi.spyOn(fs, 'writeFileSync')
    const listener = vi.fn()
    store.onSettingsChanged(listener)

    // Re-apply the same value → must be a no-op.
    store.setSetting('appearance.theme', 'midnight')
    expect(writeSpy).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    // Value is still correct.
    expect(store.getSetting('appearance.theme')).toBe('midnight')
  })

  it('still writes and notifies when the value actually changes', () => {
    store.setSetting('appearance.theme', 'midnight')

    const writeSpy = vi.spyOn(fs, 'writeFileSync')
    const listener = vi.fn()
    store.onSettingsChanged(listener)

    store.setSetting('appearance.theme', 'light')
    expect(writeSpy).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith('appearance.theme', 'light')
    expect(store.getSetting('appearance.theme')).toBe('light')
  })
})
