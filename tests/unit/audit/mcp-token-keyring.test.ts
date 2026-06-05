// Security: the MCP bearer token grants access to every DB tool, so it must
// live in the OS keyring like connection passwords — not in plaintext in
// config.json, where any local process could read it and defeat the
// loopback+token model. This pins:
//   1. registerMcpHandlers migrates a legacy plaintext token into the keyring
//      and scrubs the on-disk copy, then stores fresh tokens in the keyring;
//   2. the renderer-facing keyring channel refuses the reserved __mcp__ ns.
import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import { registerMcpHandlers } from '../../../src/main/ipc/mcp'
import { assertKeyringAccess } from '../../../src/main/ipc/keyring'
import { ConnectionAccessImpl } from '../../../src/main/plugins/sdk/connection-access'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'
import type { IpcContext } from '../../../src/main/ipc/context'

function makeKeyring() {
  const store = new Map<string, string>()
  const k = (id: string, key: string) => `${id}::${key}`
  return {
    store: store,
    has: (id: string, key: string) => store.has(k(id, key)),
    retrieveSync: (id: string, key: string) => store.get(k(id, key)) ?? null,
    storeSync: (id: string, key: string, v: string) => { store.set(k(id, key), v) },
    delete: async (id: string, key: string) => { store.delete(k(id, key)) },
    listKeys: (id: string) => Array.from(store.keys()).filter(c => c.startsWith(`${id}::`)).map(c => c.slice(id.length + 2)),
  }
}

function makeCtx(settings: Record<string, unknown>, keyring: ReturnType<typeof makeKeyring>): IpcContext {
  return {
    keyring: keyring as unknown as IpcContext['keyring'],
    configStore: {
      getSetting: (k: string) => settings[k],
      setSetting: (k: string, v: unknown) => { settings[k] = v },
    } as unknown as IpcContext['configStore'],
  } as unknown as IpcContext
}

const noopHandle = (() => {}) as unknown as Parameters<typeof registerMcpHandlers>[1]
const settingsFacade = (settings: Record<string, unknown>) => ({
  get: (k: string) => settings[k],
  set: (k: string, v: unknown) => { settings[k] = v },
})

describe('MCP token storage', () => {
  it('migrates a legacy plaintext config.json token into the keyring and scrubs it', () => {
    const keyring = makeKeyring()
    const settings: Record<string, unknown> = { 'mcp.token': 'legacy-secret-token' }
    const connAccess = new ConnectionAccessImpl(() => undefined, () => undefined)

    registerMcpHandlers(makeCtx(settings, keyring), noopHandle, connAccess, settingsFacade(settings), new ToolRegistryImpl())

    expect(keyring.retrieveSync('__mcp__', 'token')).toBe('legacy-secret-token')
    // Plaintext copy scrubbed from config.json.
    expect(settings['mcp.token']).toBe('')
  })

  it('persists a freshly generated token to the keyring, never to settings', () => {
    const keyring = makeKeyring()
    const settings: Record<string, unknown> = {}
    const connAccess = new ConnectionAccessImpl(() => undefined, () => undefined)

    const server = registerMcpHandlers(makeCtx(settings, keyring), noopHandle, connAccess, settingsFacade(settings), new ToolRegistryImpl())
    server.regenerateToken()

    const token = server.getStatus().token
    expect(token).toMatch(/\S/)
    expect(keyring.retrieveSync('__mcp__', 'token')).toBe(token)
    expect(settings['mcp.token']).toBeUndefined()
  })

  it('refuses renderer keyring access to the reserved __mcp__ namespace', () => {
    const ctx = {
      configStore: { getConnection: () => ({ id: '__mcp__' }) },
      driverRegistry: { getDriverIds: () => [], get: () => undefined },
    } as unknown as IpcContext
    expect(() => assertKeyringAccess(ctx, '__mcp__', 'token')).toThrow()
  })
})
