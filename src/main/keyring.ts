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
    const buffer = Buffer.from(encoded, 'base64')
    return safeStorage.decryptString(buffer)
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
    fs.writeFileSync(this.filePath, JSON.stringify(this.cache), 'utf-8')
  }
}
