// The plugin boot pipeline must reject manifests that are clearly malformed
// BEFORE attempting to load the plugin's module. The renderer surfaces the
// error in the Plugins panel; the runtime never executes activate() for a
// rejected plugin. This test pins each rule so a future relaxation has to
// be intentional.
import { describe, it, expect, vi } from 'vitest'

// plugin-host.ts imports electron's `app` for the user-data path. We don't
// reach that code from validateManifest, but the import itself blows up
// without a stub.
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/verql-manifest-test' },
}))

import { validateManifest } from '../../../src/main/plugins/plugin-host'
import type { PluginManifest } from '../../../src/main/plugins/types'

function good(): PluginManifest {
  return {
    name: 'verql-plugin-example',
    version: '1.0.0',
    displayName: 'Example',
    description: 'An example plugin',
    main: 'index.js',
    contributes: {},
  }
}

describe('validateManifest', () => {
  it('accepts a minimal well-formed manifest', () => {
    expect(validateManifest(good()).valid).toBe(true)
  })

  it('rejects empty / malformed name', () => {
    expect(validateManifest({ ...good(), name: '' }).valid).toBe(false)
    expect(validateManifest({ ...good(), name: 'Bad Name' }).valid).toBe(false)
    expect(validateManifest({ ...good(), name: 'Bad/Name' }).valid).toBe(false)
    expect(validateManifest({ ...good(), name: 'BADCASE' }).valid).toBe(false)
  })

  it('rejects non-semver version', () => {
    expect(validateManifest({ ...good(), version: '' }).valid).toBe(false)
    expect(validateManifest({ ...good(), version: '1' }).valid).toBe(false)
    expect(validateManifest({ ...good(), version: '1.0' }).valid).toBe(false)
    expect(validateManifest({ ...good(), version: 'not-a-version' }).valid).toBe(false)
  })

  it('rejects main entry that is not a JavaScript file', () => {
    expect(validateManifest({ ...good(), main: '' }).valid).toBe(false)
    expect(validateManifest({ ...good(), main: 'index.ts' }).valid).toBe(false)
    expect(validateManifest({ ...good(), main: 'plugin.exe' }).valid).toBe(false)
  })

  it('rejects empty displayName / description', () => {
    expect(validateManifest({ ...good(), displayName: '' }).valid).toBe(false)
    expect(validateManifest({ ...good(), description: '' }).valid).toBe(false)
  })

  it('rejects a driver contribution missing id or name', () => {
    expect(validateManifest({
      ...good(),
      contributes: { drivers: [{ id: '', name: 'X' } as unknown as { id: string; name: string }] },
    }).valid).toBe(false)
    expect(validateManifest({
      ...good(),
      contributes: { drivers: [{ id: 'x', name: '' } as unknown as { id: string; name: string }] },
    }).valid).toBe(false)
  })

  it('rejects a panel contribution missing required fields', () => {
    expect(validateManifest({
      ...good(),
      contributes: {
        panels: [{ id: 'p', title: '', icon: 'x', location: 'sidebar' } as unknown as never],
      },
    }).valid).toBe(false)
    expect(validateManifest({
      ...good(),
      contributes: {
        panels: [{ id: 'p', title: 't', icon: '', location: 'sidebar' } as unknown as never],
      },
    }).valid).toBe(false)
  })

  it('rejects a theme contribution missing id or type', () => {
    expect(validateManifest({
      ...good(),
      contributes: {
        themes: [{ id: '', name: 'X', type: 'dark' } as unknown as never],
      },
    }).valid).toBe(false)
  })

  it('rejects a connection-field contribution missing required fields', () => {
    expect(validateManifest({
      ...good(),
      contributes: {
        connectionFields: [{ key: 'host', label: '', type: 'text' } as unknown as never],
      },
    }).valid).toBe(false)
  })

  it('rejects a setting contribution missing key/title/type', () => {
    expect(validateManifest({
      ...good(),
      contributes: {
        settings: [{ key: '', title: 't', type: 'text' } as unknown as never],
      },
    }).valid).toBe(false)
  })
})
