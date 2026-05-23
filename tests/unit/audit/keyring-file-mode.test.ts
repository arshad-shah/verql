// Regression test: the encrypted-credentials blob on disk must be owner-only.
//
// Without an explicit mode, fs.writeFileSync() applies the process umask
// (typically 0o022), which leaves the file 0o644 — world-readable on any
// shared system. The contents are encrypted via Electron's safeStorage, but
// "encrypted" is not a substitute for filesystem ACLs: an attacker with
// local read access can still copy the blob off the box and brute it later,
// or just wait for the OS keychain to be compromised in a separate incident.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(`enc:${text}`),
    decryptString: (b: Buffer) => b.toString().replace(/^enc:/, ''),
  },
  app: { getPath: () => '/tmp/verql-keyring-mode-test' },
}))

interface WriteCall { path: string; data: string; options: { mode?: number } | undefined }
const writes: WriteCall[] = []
const files: Record<string, string> = {}

vi.mock('fs', () => ({
  default: {
    existsSync: (p: string) => p in files,
    readFileSync: (p: string) => files[p] ?? '',
    writeFileSync: (
      p: string,
      data: string,
      options?: BufferEncoding | { encoding?: BufferEncoding; mode?: number },
    ) => {
      const optsObj = typeof options === 'object' ? options : undefined
      writes.push({ path: p, data, options: optsObj })
      files[p] = data
    },
    renameSync: (from: string, to: string) => {
      files[to] = files[from]
      delete files[from]
    },
    unlinkSync: (p: string) => { delete files[p] },
    mkdirSync: () => {},
  },
}))

import { KeyringService } from '../../../src/main/keyring'

beforeEach(() => {
  writes.length = 0
  for (const k of Object.keys(files)) delete files[k]
})

describe('KeyringService — on-disk file mode', () => {
  it('writes the credentials blob with mode 0o600 (owner read/write only)', async () => {
    const k = new KeyringService()
    await k.store('p1', 'password', 'secret')
    // Find the write that targeted the temp file used for the atomic publish.
    const credentialWrites = writes.filter(w => w.path.endsWith('.tmp') || w.path.endsWith('credentials.enc'))
    expect(credentialWrites.length).toBeGreaterThan(0)
    for (const w of credentialWrites) {
      expect(w.options?.mode).toBe(0o600)
    }
  })
})
