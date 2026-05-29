// End-to-end test of the process-isolation bridge over an in-memory transport.
// A fake plugin module runs in the "worker" (worker-runtime) while the host
// IsolatedPlugin registers proxy contributions and serves capability calls
// through a REAL guarded PluginContext — so permission enforcement is exercised
// across the (simulated) process boundary exactly as in production.
import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import { createMemoryTransportPair } from '../../../src/main/plugins/isolation/memory-transport'
import { startWorker } from '../../../src/main/plugins/isolation/worker-runtime'
import { IsolatedPlugin, canIsolate } from '../../../src/main/plugins/isolation/isolated-plugin'
import { createPluginContext } from '../../../src/main/plugins/sdk'
import type { PluginManifest } from '../../../src/main/plugins/types'

function fakeKeyring() {
  return {
    store: vi.fn(async () => {}),
    retrieve: vi.fn(async () => 'secret-value'),
    delete: vi.fn(async () => {}),
    retrieveSync: vi.fn(() => null),
    storeSync: vi.fn(() => {}),
    has: vi.fn(() => false),
    listKeys: vi.fn(() => []),
  }
}

function fakeConnections(query = vi.fn(async () => ({ rows: [{ x: 1 }], fields: [] }))) {
  return {
    getActiveConnectionId: vi.fn(() => null),
    getProfile: vi.fn(() => null),
    query,
    cancelQuery: vi.fn(() => {}),
    onActiveConnectionChanged: vi.fn(() => ({ dispose() {} })),
  }
}

function hostContext(over: Record<string, unknown>) {
  const noop = new Proxy({}, { get: () => () => ({ dispose() {} }) })
  return createPluginContext({
    pluginName: 'p',
    trusted: false,
    grantedPermissions: [],
    driverRegistry: noop,
    commandRegistry: noop,
    panelRegistry: noop,
    uiRegistry: noop,
    completionRegistry: noop,
    schemaAccess: noop,
    connectionAccess: fakeConnections(),
    settingsStore: { get: vi.fn(() => undefined), set: vi.fn() },
    keyring: fakeKeyring(),
    services: { provide: () => ({ dispose() {} }), consume: () => undefined, onAvailable: () => ({ dispose() {} }) },
    exporterRegistry: noop,
    importerRegistry: noop,
    formatterRegistry: noop,
    typeMapperRegistry: noop,
    themeRegistry: noop,
    notificationBus: { show: () => {} },
    dragDropRegistry: noop,
    toolRegistry: noop,
    ...over,
  } as unknown as Parameters<typeof createPluginContext>[0])
}

function fakeRegistries() {
  const commands = new Map<string, (payload?: unknown) => unknown>()
  const themes = new Map<string, unknown>()
  return {
    commands,
    themes,
    commandRegistry: {
      register: (id: string, handler: (payload?: unknown) => unknown) => {
        commands.set(id, handler)
        return { dispose: () => commands.delete(id) }
      },
    } as never,
    themeRegistry: {
      register: (t: { id: string }) => {
        themes.set(t.id, t)
        return { dispose: () => themes.delete(t.id) }
      },
    } as never,
  }
}

// A fake plugin module the worker "requires". It contributes a command + a
// theme and, inside command handlers, calls back into the host capabilities.
const fakePlugin = {
  activate(ctx: {
    commands: { register: (id: string, h: (p?: unknown) => unknown) => unknown }
    themes: { register: (t: unknown) => unknown }
    connections: { query: (id: string, sql: string) => Promise<unknown> }
    keyring: { retrieve: (p: string, k: string) => Promise<unknown> }
  }) {
    ctx.commands.register('run-query', async () => {
      return ctx.connections.query('conn1', 'SELECT 1')
    })
    ctx.commands.register('read-secret', async () => {
      return ctx.keyring.retrieve('profile', 'token')
    })
    ctx.themes.register({ id: 'my-theme', name: 'My Theme', type: 'dark' })
  },
}

function setup(grantedPermissions: string[], over: Record<string, unknown> = {}) {
  const { host, worker } = createMemoryTransportPair()
  startWorker(worker, { requireModule: () => fakePlugin })
  const reg = fakeRegistries()
  const context = hostContext({ grantedPermissions, ...over })
  const onCrash = vi.fn()
  const isolated = new IsolatedPlugin(host, {
    pluginName: 'p',
    mainPath: '/fake/plugin/index.js',
    context,
    commandRegistry: reg.commandRegistry,
    themeRegistry: reg.themeRegistry,
    onCrash,
  })
  return { isolated, ...reg, context, onCrash, host, worker }
}

describe('canIsolate', () => {
  const base: PluginManifest = {
    name: 'p', version: '1.0.0', displayName: 'P', description: 'd', main: 'i.js', contributes: {},
  }
  it('isolates command/theme-only plugins', () => {
    expect(canIsolate({ ...base, contributes: { commands: [{ id: 'a', title: 'A' }] } })).toBe(true)
    expect(canIsolate({ ...base, contributes: { themes: [{ id: 't', name: 'T', type: 'dark' }] } })).toBe(true)
  })
  it('does not isolate plugins with non-marshallable surfaces', () => {
    expect(canIsolate({ ...base, contributes: { drivers: [{ id: 'd', name: 'D' }] } })).toBe(false)
    expect(canIsolate({ ...base, contributes: { exporters: [{ id: 'e', name: 'E', extension: 'x' }] } })).toBe(false)
  })
})

describe('IsolatedPlugin bridge', () => {
  it('registers proxy contributions reported by the worker', async () => {
    const { isolated, commands, themes } = setup([])
    const registered = await isolated.activate()
    expect(commands.has('p:run-query')).toBe(true)
    expect(commands.has('p:read-secret')).toBe(true)
    expect(themes.has('my-theme')).toBe(true)
    expect(registered).toContain('command:run-query')
    expect(registered).toContain('theme:my-theme')
  })

  it('forwards a command invocation across the boundary to a granted capability', async () => {
    const query = vi.fn(async () => ({ rows: [{ x: 1 }], fields: [] }))
    const { isolated, commands } = setup(['connections'], { connectionAccess: fakeConnections(query) })
    await isolated.activate()
    await commands.get('p:run-query')!()
    expect(query).toHaveBeenCalledOnce()
    expect(query.mock.calls[0].slice(0, 2)).toEqual(['conn1', 'SELECT 1'])
  })

  it('enforces permissions host-side: an ungranted capability is denied', async () => {
    const keyring = fakeKeyring()
    // Grant connections but NOT keyring.
    const { isolated, commands } = setup(['connections'], { keyring })
    await isolated.activate()
    await commands.get('p:read-secret')!().then(
      () => { throw new Error('should have been denied') },
      (err: Error & { permission?: string }) => {
        expect(err.name).toBe('PermissionDeniedError')
        expect(err.permission).toBe('keyring')
      },
    )
    expect(keyring.retrieve).not.toHaveBeenCalled()
  })

  it('allows the capability once granted', async () => {
    const keyring = fakeKeyring()
    const { isolated, commands } = setup(['keyring'], { keyring })
    await isolated.activate()
    await expect(commands.get('p:read-secret')!()).resolves.toBe('secret-value')
    expect(keyring.retrieve).toHaveBeenCalledWith('profile', 'token')
  })

  it('reports a crash and tears down proxies when the worker exits', async () => {
    const { isolated, commands, onCrash, worker } = setup([])
    await isolated.activate()
    expect(commands.size).toBe(2)
    worker.close() // simulate the worker process exiting; host transport sees close
    await new Promise((r) => setTimeout(r, 10))
    expect(onCrash).toHaveBeenCalledOnce()
    expect(commands.size).toBe(0) // proxies disposed
  })
})
