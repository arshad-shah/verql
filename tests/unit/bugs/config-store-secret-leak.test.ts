// Regression test: ConfigStore must never write plaintext connection
// secrets to config.json — not even as a side effect of an unrelated
// settings change or a connection delete.
//
// The at-rest model (see src/main/ipc/profile-secrets.ts) is:
//   - on disk (config.json): secret fields blanked (empty string)
//   - in memory: full plaintext, injected from the keyring
//
// `saveConnection(profile, secretKeys)` correctly strips secrets before
// writing. But `save()` serialised the in-memory `this.data` directly,
// and `setSetting()` / `resetCategory()` / `deleteConnection()` all call
// `save()`. So the moment a user toggled *any* setting, every saved
// connection's password was re-written to disk in cleartext, silently
// defeating the keyring.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { ConfigStore } from '../../../src/main/config/store'
import type { KeyringLike } from '../../../src/main/ipc/profile-secrets'
import type { ConnectionProfile } from '../../../shared/types'

function makeKeyring(): KeyringLike {
  const store = new Map<string, string>()
  const k = (id: string, key: string) => `${id}::${key}`
  return {
    listKeys: (id) =>
      Array.from(store.keys())
        .filter((c) => c.startsWith(`${id}::`))
        .map((c) => c.slice(id.length + 2)),
    storeSync: (id, key, value) => { store.set(k(id, key), value) },
    retrieveSync: (id, key) => store.get(k(id, key)) ?? null,
    delete: async (id, key) => { store.delete(k(id, key)) },
  }
}

let configPath: string

beforeEach(() => {
  configPath = path.join(
    os.tmpdir(),
    `verql-secret-leak-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  )
})

afterEach(() => {
  try { fs.unlinkSync(configPath) } catch { /* ignore */ }
})

function readDisk(): { connections: Array<Record<string, unknown>> } {
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

describe('ConfigStore — secrets never leak to disk', () => {
  const profile: ConnectionProfile = {
    id: 'p1',
    name: 'P1',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'app',
    username: 'admin',
    password: 'super-secret',
  } as ConnectionProfile

  it('blanks the secret on disk after saveConnection', () => {
    const store = new ConfigStore(configPath, makeKeyring())
    store.saveConnection(profile, ['password'])
    expect(readDisk().connections[0].password).toBe('')
  })

  it('keeps the secret blanked on disk after an unrelated setSetting', () => {
    const store = new ConfigStore(configPath, makeKeyring())
    store.saveConnection(profile, ['password'])

    // Unrelated settings change → triggers save() of the whole config.
    store.setSetting('appearance.theme', 'light')

    const disk = readDisk()
    expect(disk.connections[0].password).toBe('')
    // In-memory copy must still be plaintext-complete.
    expect(store.getConnection('p1')?.password).toBe('super-secret')
  })

  it('keeps secrets blanked on disk after deleting a different connection', async () => {
    const keyring = makeKeyring()
    const store = new ConfigStore(configPath, keyring)
    store.saveConnection(profile, ['password'])
    store.saveConnection(
      { ...profile, id: 'p2', name: 'P2', password: 'second-secret' } as ConnectionProfile,
      ['password'],
    )

    await store.deleteConnection('p2')

    const disk = readDisk()
    const p1 = disk.connections.find((c) => c.id === 'p1')
    expect(p1?.password).toBe('')
  })
})
