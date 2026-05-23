// Ergonomic `definePlugin` helper: lets a third-party plugin export an
// idiomatic shape with strong type inference, instead of hand-writing the
// manifest + activate function and discovering type mistakes only when the
// boot pipeline rejects them. Pure pass-through at runtime — the value is
// the compile-time guidance.
import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import { definePlugin } from '../../../src/main/plugins/sdk'

describe('definePlugin', () => {
  it('passes the module through unchanged', () => {
    const plugin = definePlugin({
      manifest: {
        name: 'example',
        version: '1.0.0',
        displayName: 'Example',
        description: 'demo',
        main: 'index.js',
        contributes: {},
      },
      activate: () => {},
    })
    expect(plugin.manifest.name).toBe('example')
    expect(typeof plugin.activate).toBe('function')
  })

  it('preserves optional deactivate', () => {
    const deactivate = vi.fn()
    const plugin = definePlugin({
      manifest: {
        name: 'with-deactivate',
        version: '1.0.0',
        displayName: 'X',
        description: 'X',
        main: 'index.js',
        contributes: {},
      },
      activate: () => {},
      deactivate,
    })
    plugin.deactivate?.()
    expect(deactivate).toHaveBeenCalled()
  })
})
