import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'

// Tag for entries we could not encrypt (no OS keyring backend available, e.g.
// headless / WSL2 Linux). A ':' never appears in base64, so a tagged value can
// never be mistaken for a legacy (untagged) encrypted blob.
const PLAINTEXT_PREFIX = 'plain:'

export class KeyringService {
  private filePath: string
  private cache: Record<string, string> = {}
  private warnedNoEncryption = false

  constructor() {
    const userDataPath = app.getPath('userData')
    fs.mkdirSync(userDataPath, { recursive: true })
    this.filePath = path.join(userDataPath, 'credentials.enc')
    this.load()
  }

  // Encrypt via the OS keyring when available; otherwise fall back to an
  // obfuscated (NOT encrypted) representation so secret writes don't crash on
  // platforms without a backend. The credentials file is mode 0600 either way.
  private encode(value: string): string {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(value).toString('base64')
    }
    if (!this.warnedNoEncryption) {
      this.warnedNoEncryption = true
      console.warn(
        '[keyring] OS encryption is unavailable; storing secrets WITHOUT encryption ' +
          '(credentials file is restricted to mode 0600). Install/enable a keyring ' +
          '(e.g. gnome-keyring/libsecret) for at-rest encryption.'
      )
    }
    return PLAINTEXT_PREFIX + Buffer.from(value, 'utf-8').toString('base64')
  }

  private decode(encoded: string): string {
    if (encoded.startsWith(PLAINTEXT_PREFIX)) {
      return Buffer.from(encoded.slice(PLAINTEXT_PREFIX.length), 'base64').toString('utf-8')
    }
    return safeStorage.decryptString(Buffer.from(encoded, 'base64'))
  }

  async store(profileId: string, key: string, value: string): Promise<void> {
    const compositeKey = `${profileId}:${key}`
    this.cache[compositeKey] = this.encode(value)
    this.save()
  }

  async retrieve(profileId: string, key: string): Promise<string | null> {
    return this.retrieveSync(profileId, key)
  }

  retrieveSync(profileId: string, key: string): string | null {
    const compositeKey = `${profileId}:${key}`
    const encoded = this.cache[compositeKey]
    if (!encoded) return null
    try {
      return this.decode(encoded)
    } catch {
      // safeStorage's underlying OS key changed (keychain reset, OS reinstall,
      // OAuth token lost). The stored ciphertext is unrecoverable — drop it so
      // we don't keep throwing on every read and surface a clean "missing key"
      // state to callers, who can then prompt the user to re-enter it.
      delete this.cache[compositeKey]
      this.save()
      return null
    }
  }

  has(profileId: string, key: string): boolean {
    return Boolean(this.cache[`${profileId}:${key}`])
  }

  storeSync(profileId: string, key: string, value: string): void {
    const compositeKey = `${profileId}:${key}`
    if (!value) {
      delete this.cache[compositeKey]
    } else {
      this.cache[compositeKey] = this.encode(value)
    }
    this.save()
  }

  async delete(profileId: string, key: string): Promise<void> {
    const compositeKey = `${profileId}:${key}`
    delete this.cache[compositeKey]
    this.save()
  }

  listKeys(profileId: string): string[] {
    const prefix = `${profileId}:`
    return Object.keys(this.cache)
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length))
  }

  async deleteAll(profileId: string): Promise<void> {
    const prefix = `${profileId}:`
    for (const key of Object.keys(this.cache)) {
      if (key.startsWith(prefix)) {
        delete this.cache[key]
      }
    }
    this.save()
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      } catch {
        this.cache = {}
      }
    }
  }

  private save(): void {
    // Atomic publish: write the new ciphertext blob to a sibling temp
    // file and rename it onto the keyring. A crash mid-write would
    // otherwise leave the file unparseable and we'd silently lose every
    // saved credential on next launch.
    //
    // mode 0o600 (owner read/write only) — the blob is encrypted via
    // safeStorage, but encryption is not a substitute for filesystem ACLs
    // on multi-user systems. A local attacker with shell access shouldn't
    // be able to copy the file off and brute-force it offline.
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const tmpPath = path.join(dir, `.${path.basename(this.filePath)}.${process.pid}.${Date.now()}.tmp`)
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(this.cache), { encoding: 'utf-8', mode: 0o600 })
      fs.renameSync(tmpPath, this.filePath)
    } catch (err) {
      try { fs.unlinkSync(tmpPath) } catch { /* ignore — temp may not exist */ }
      throw err
    }
  }
}
