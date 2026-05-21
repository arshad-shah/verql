import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Electron's safeStorage — tests run in Node, not Electron
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(`encrypted:${text}`),
    decryptString: (buffer: Buffer) => buffer.toString().replace('encrypted:', '')
  },
  app: {
    getPath: () => '/tmp/verql-test'
  }
}))

// Mock fs to avoid real file I/O. The keyring writes atomically (write
// to a sibling temp file, then rename onto the final path), so the
// mock simulates a tiny in-memory filesystem keyed by absolute path.
const mockFs: Record<string, string> = {}
const mockStore: Record<string, string> = {}
vi.mock('fs', () => ({
  default: {
    existsSync: (p: string) => p in mockFs || Object.keys(mockStore).length > 0,
    readFileSync: (p: string) => mockFs[p] ?? JSON.stringify(mockStore),
    writeFileSync: (p: string, data: string) => {
      mockFs[p] = data
      // Mirror writes onto the in-memory keyring snapshot so reads after
      // a "rename" still observe the same data shape the real keyring
      // would see on next boot.
      try {
        const parsed = JSON.parse(data)
        for (const key of Object.keys(mockStore)) delete mockStore[key]
        Object.assign(mockStore, parsed)
      } catch { /* not a credentials JSON write */ }
    },
    renameSync: (from: string, to: string) => {
      mockFs[to] = mockFs[from]
      delete mockFs[from]
    },
    unlinkSync: (p: string) => { delete mockFs[p] },
    mkdirSync: () => {}
  }
}))

import { KeyringService } from '../../src/main/keyring'

describe('KeyringService', () => {
  let keyring: KeyringService

  beforeEach(() => {
    for (const key of Object.keys(mockStore)) delete mockStore[key]
    for (const key of Object.keys(mockFs)) delete mockFs[key]
    keyring = new KeyringService()
  })

  it('stores and retrieves a credential', async () => {
    await keyring.store('conn1', 'password', 'secret123')
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBe('secret123')
  })

  it('returns null for missing credential', async () => {
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBeNull()
  })

  it('deletes a credential', async () => {
    await keyring.store('conn1', 'password', 'secret123')
    await keyring.delete('conn1', 'password')
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBeNull()
  })

  it('deleteAll removes all credentials for a profile', async () => {
    await keyring.store('conn1', 'password', 'secret')
    await keyring.store('conn1', 'ssoToken', 'token')
    await keyring.store('conn2', 'password', 'other')
    await keyring.deleteAll('conn1')
    expect(await keyring.retrieve('conn1', 'password')).toBeNull()
    expect(await keyring.retrieve('conn1', 'ssoToken')).toBeNull()
    expect(await keyring.retrieve('conn2', 'password')).toBe('other')
  })

  it('overwrites existing credential', async () => {
    await keyring.store('conn1', 'password', 'old')
    await keyring.store('conn1', 'password', 'new')
    expect(await keyring.retrieve('conn1', 'password')).toBe('new')
  })
})
