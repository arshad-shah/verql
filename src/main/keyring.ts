import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'

export class KeyringService {
  private filePath: string
  private cache: Record<string, string> = {}

  constructor() {
    const userDataPath = app.getPath('userData')
    fs.mkdirSync(userDataPath, { recursive: true })
    this.filePath = path.join(userDataPath, 'credentials.enc')
    this.load()
  }

  async store(profileId: string, key: string, value: string): Promise<void> {
    const compositeKey = `${profileId}:${key}`
    const encrypted = safeStorage.encryptString(value)
    this.cache[compositeKey] = encrypted.toString('base64')
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
      const buffer = Buffer.from(encoded, 'base64')
      return safeStorage.decryptString(buffer)
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
      const encrypted = safeStorage.encryptString(value)
      this.cache[compositeKey] = encrypted.toString('base64')
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
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const tmpPath = path.join(dir, `.${path.basename(this.filePath)}.${process.pid}.${Date.now()}.tmp`)
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(this.cache), 'utf-8')
      fs.renameSync(tmpPath, this.filePath)
    } catch (err) {
      try { fs.unlinkSync(tmpPath) } catch { /* ignore — temp may not exist */ }
      throw err
    }
  }
}
