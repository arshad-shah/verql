// Plugin capability/permission model.
//
// Third-party plugins run as code in the main process, so the permission model
// is defence-in-depth: the host gates the sensitive *host-provided* surfaces
// (keyring, connections, custom ipc, raw root settings) so an untrusted plugin
// can't reach them without an explicit, declared, user-approved grant. These
// tests pin that boundary.
import { describe, it, expect, vi } from 'vitest'

// createPluginContext touches ipcMain/BrowserWindow; a minimal stub is enough.
vi.mock('electron', () => ({
  ipcMain: { handle: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import { createPluginContext } from '../../../src/main/plugins/sdk'
import {
  effectiveGrants,
  isPluginPermission,
  PermissionDeniedError,
  hasPermission,
  ALL_PERMISSIONS,
} from '../../../src/main/plugins/sdk/permissions'
import { validateManifest } from '../../../src/main/plugins/plugin-host'
import type { PluginManifest } from '../../../src/main/plugins/types'

// A keyring spy whose methods we can assert were/weren't reached.
function fakeKeyring() {
  return {
    store: vi.fn(async () => {}),
    retrieve: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
    retrieveSync: vi.fn(() => null),
    storeSync: vi.fn(() => {}),
    has: vi.fn(() => false),
    listKeys: vi.fn(() => []),
  }
}

function fakeConnections() {
  return {
    getActiveConnectionId: vi.fn(() => null),
    getProfile: vi.fn(() => null),
    query: vi.fn(async () => ({ rows: [], fields: [] }) as never),
    cancelQuery: vi.fn(() => {}),
    onActiveConnectionChanged: vi.fn(() => ({ dispose() {} })),
  }
}

// Minimal registry stubs — the surfaces we don't gate just need to be present.
function ctxDeps(overrides: Record<string, unknown>) {
  const noopRegistry = new Proxy(
    {},
    { get: () => () => ({ dispose() {} }) },
  )
  const settingsStore = { get: vi.fn(() => undefined), set: vi.fn(() => {}) }
  return {
    pluginName: 'test-plugin',
    trusted: false,
    grantedPermissions: [],
    driverRegistry: noopRegistry,
    commandRegistry: noopRegistry,
    panelRegistry: noopRegistry,
    uiRegistry: noopRegistry,
    completionRegistry: noopRegistry,
    schemaAccess: noopRegistry,
    connectionAccess: fakeConnections(),
    settingsStore,
    keyring: fakeKeyring(),
    services: { provide: () => ({ dispose() {} }), consume: () => undefined, onAvailable: () => ({ dispose() {} }) },
    exporterRegistry: noopRegistry,
    importerRegistry: noopRegistry,
    formatterRegistry: noopRegistry,
    typeMapperRegistry: noopRegistry,
    themeRegistry: noopRegistry,
    notificationBus: { show: () => {} },
    dragDropRegistry: noopRegistry,
    toolRegistry: noopRegistry,
    ...overrides,
  } as unknown as Parameters<typeof createPluginContext>[0]
}

describe('effectiveGrants', () => {
  it('intersects user grants with declared permissions', () => {
    const eff = effectiveGrants(['keyring', 'connections'], ['keyring', 'ipc'])
    expect([...eff].sort()).toEqual(['keyring'])
  })

  it('a plugin can never be granted something it did not declare', () => {
    // Stale grant record lists ipc, but the manifest no longer declares it.
    const eff = effectiveGrants(['keyring'], ['keyring', 'ipc'])
    expect(eff.has('ipc')).toBe(false)
  })

  it('handles undefined inputs', () => {
    expect([...effectiveGrants(undefined, undefined)]).toEqual([])
    expect([...effectiveGrants(['keyring'], undefined)]).toEqual([])
  })
})

describe('isPluginPermission', () => {
  it('accepts known permissions and rejects unknown', () => {
    expect(isPluginPermission('keyring')).toBe(true)
    expect(isPluginPermission('connections')).toBe(true)
    expect(isPluginPermission('root')).toBe(false)
    expect(isPluginPermission(42)).toBe(false)
  })
})

describe('hasPermission', () => {
  it('trusted plugins always pass', () => {
    expect(hasPermission({ trusted: true, granted: new Set() }, 'keyring')).toBe(true)
  })
  it('untrusted plugins pass only for granted capabilities', () => {
    const grant = { trusted: false, granted: new Set(['keyring'] as const) }
    expect(hasPermission(grant, 'keyring')).toBe(true)
    expect(hasPermission(grant, 'connections')).toBe(false)
  })
})

describe('validateManifest — permissions', () => {
  const base: PluginManifest = {
    name: 'test-plugin',
    version: '1.0.0',
    displayName: 'Test',
    description: 'desc',
    main: 'index.js',
    contributes: {},
  }
  it('accepts a manifest with known permissions', () => {
    expect(validateManifest({ ...base, permissions: ['keyring', 'connections'] }).valid).toBe(true)
  })
  it('rejects an unknown permission', () => {
    const r = validateManifest({ ...base, permissions: ['root-access'] as never })
    expect(r.valid).toBe(false)
    expect(r.error).toContain('Unknown permission')
  })
  it('rejects a non-array permissions field', () => {
    const r = validateManifest({ ...base, permissions: 'keyring' as never })
    expect(r.valid).toBe(false)
  })
})

describe('createPluginContext — capability gating', () => {
  it('blocks keyring for an untrusted plugin with no grant', async () => {
    const keyring = fakeKeyring()
    const ctx = createPluginContext(ctxDeps({ keyring, trusted: false, grantedPermissions: [] }))
    await expect(ctx.keyring.retrieve('p', 'k')).rejects.toBeInstanceOf(PermissionDeniedError)
    expect(keyring.retrieve).not.toHaveBeenCalled()
  })

  it('allows keyring once the capability is granted', async () => {
    const keyring = fakeKeyring()
    const ctx = createPluginContext(ctxDeps({ keyring, trusted: false, grantedPermissions: ['keyring'] }))
    await ctx.keyring.retrieve('p', 'k')
    expect(keyring.retrieve).toHaveBeenCalledOnce()
  })

  it('blocks connections for an untrusted plugin with no grant', async () => {
    const connectionAccess = fakeConnections()
    const ctx = createPluginContext(ctxDeps({ connectionAccess, trusted: false, grantedPermissions: [] }))
    expect(() => ctx.connections.getActiveConnectionId()).toThrow(PermissionDeniedError)
    await expect(ctx.connections.query('c', 'select 1')).rejects.toBeInstanceOf(PermissionDeniedError)
    expect(connectionAccess.query).not.toHaveBeenCalled()
  })

  it('blocks custom ipc.handle for an untrusted plugin with no grant', () => {
    const ctx = createPluginContext(ctxDeps({ trusted: false, grantedPermissions: [] }))
    expect(() => ctx.ipc.handle('my:channel' as never, () => {})).toThrow(PermissionDeniedError)
  })

  it('allows ipc.handle once the capability is granted', () => {
    const ctx = createPluginContext(ctxDeps({ trusted: false, grantedPermissions: ['ipc'] }))
    expect(() => ctx.ipc.handle('my:channel' as never, () => {})).not.toThrow()
  })

  it('restricts rootSettings to trusted plugins', () => {
    const untrusted = createPluginContext(ctxDeps({ trusted: false, grantedPermissions: [...ALL_PERMISSIONS] }))
    expect(() => untrusted.rootSettings.get('ai.activeProvider')).toThrow(/trusted/)
  })

  it('trusted (bundled) plugins bypass every gate', async () => {
    const keyring = fakeKeyring()
    const connectionAccess = fakeConnections()
    const settingsStore = { get: vi.fn(() => 'openai'), set: vi.fn() }
    const ctx = createPluginContext(
      ctxDeps({ keyring, connectionAccess, settingsStore, trusted: true, grantedPermissions: [] }),
    )
    await ctx.keyring.retrieve('p', 'k')
    ctx.connections.getActiveConnectionId()
    expect(ctx.rootSettings.get('ai.activeProvider')).toBe('openai')
    expect(keyring.retrieve).toHaveBeenCalledOnce()
    expect(connectionAccess.getActiveConnectionId).toHaveBeenCalledOnce()
  })
})
