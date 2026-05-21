import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'
import type { AppSettings } from '@shared/settings'
import { defaultSettings, mergeWithDefaults } from '@shared/settings'
import {
  extractAndPersistSecrets,
  injectSecretsFromKeyring,
  deleteProfileSecrets,
  type KeyringLike,
} from '../ipc/profile-secrets'

/** No-op keyring used in environments where safeStorage is unavailable (tests). */
const noOpKeyring: KeyringLike = {
  listKeys: () => [],
  storeSync: () => undefined,
  retrieveSync: () => null,
  delete: async () => undefined,
}

// Settings paths arrive over IPC from the renderer. Reject segments that
// would walk into the prototype chain — without this guard, a renderer
// (or a misbehaving plugin) can pollute `Object.prototype` via
// `setSetting('__proto__.polluted', …)` and affect every other object
// in the main process.
const FORBIDDEN_KEYPATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

function splitSettingsKeyPath(keyPath: string): string[] {
  const parts = keyPath.split('.')
  for (const part of parts) {
    if (FORBIDDEN_KEYPATH_SEGMENTS.has(part)) {
      throw new Error(`Settings key path '${keyPath}' contains forbidden segment '${part}'`)
    }
    if (part.length === 0) {
      throw new Error(`Settings key path '${keyPath}' contains an empty segment`)
    }
  }
  return parts
}

interface ConfigData {
  connections: ConnectionProfile[]
  settings: AppSettings
}

type SettingsListener = (key: string, value: unknown) => void

export class ConfigStore {
  private filePath: string
  private data: ConfigData
  private listeners: SettingsListener[] = []
  private keyring: KeyringLike

  constructor(filePath: string, keyring?: KeyringLike) {
    this.filePath = filePath
    this.keyring = keyring ?? noOpKeyring
    this.data = this.load()
    // Inject secrets from keyring into the in-memory profiles so all callers
    // (adapters, plugins) always see the full plaintext connection profile.
    this.data.connections = this.data.connections.map(p =>
      injectSecretsFromKeyring(p, this.keyring)
    )
  }

  private load(): ConfigData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          connections: parsed.connections ?? [],
          settings: mergeWithDefaults(parsed.settings ?? {}),
        }
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { connections: [], settings: { ...defaultSettings } }
  }

  private save(): void {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  // ─── Connections ──────────────────────────────────────────────
  listConnections(): ConnectionProfile[] {
    return [...this.data.connections]
  }

  getConnection(id: string): ConnectionProfile | undefined {
    return this.data.connections.find(c => c.id === id)
  }

  /**
   * Persist a connection profile.
   *
   * When `secretKeys` is provided, secret fields are extracted into the keyring
   * and the on-disk record is written with those fields blanked. The returned
   * profile and the in-memory state always contain plaintext secrets so that
   * existing callers (adapters, plugins) continue to work without changes.
   *
   * When `secretKeys` is omitted the profile is written as-is (legacy / test path).
   */
  saveConnection(profile: ConnectionProfile, secretKeys?: Iterable<string>): ConnectionProfile {
    let onDisk: ConnectionProfile
    let inMemory: ConnectionProfile

    if (secretKeys) {
      // Strip secrets → keyring, blank on disk
      onDisk = extractAndPersistSecrets(profile, secretKeys, this.keyring)
      // Re-inject from keyring so in-memory copy is always complete
      inMemory = injectSecretsFromKeyring(onDisk, this.keyring)
    } else {
      onDisk = profile
      inMemory = profile
    }

    // Update in-memory store (plaintext)
    const idx = this.data.connections.findIndex(c => c.id === profile.id)
    if (idx >= 0) {
      this.data.connections[idx] = inMemory
    } else {
      this.data.connections.push(inMemory)
    }

    // Persist to disk with secrets blanked
    this._persist(onDisk)
    return inMemory
  }

  /**
   * Write a single profile to disk (secrets should already be stripped before
   * calling this). Updates the on-disk JSON without touching the in-memory state.
   */
  private _persist(profile: ConnectionProfile): void {
    // Build the list we'll write: replace the matching entry (or append) with
    // the stripped/on-disk version, leaving all other profiles untouched on disk.
    // We need to read what's currently on disk to avoid writing plaintext for
    // other profiles that may still be in-memory only.
    let diskConnections: ConnectionProfile[]
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        diskConnections = (JSON.parse(raw) as { connections?: ConnectionProfile[] }).connections ?? []
      } else {
        diskConnections = []
      }
    } catch {
      diskConnections = []
    }
    const diskIdx = diskConnections.findIndex(c => c.id === profile.id)
    if (diskIdx >= 0) {
      diskConnections[diskIdx] = profile
    } else {
      diskConnections.push(profile)
    }
    // Write full config with updated connections list
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const diskData = {
      connections: diskConnections,
      settings: this.data.settings,
    }
    fs.writeFileSync(this.filePath, JSON.stringify(diskData, null, 2), 'utf-8')
  }

  deleteConnection(id: string): void {
    deleteProfileSecrets(id, this.keyring)
    this.data.connections = this.data.connections.filter(c => c.id !== id)
    this.save()
  }

  // ─── Settings ─────────────────────────────────────────────────
  getAllSettings(): AppSettings {
    return this.data.settings
  }

  getSettingsCategory<K extends keyof AppSettings>(category: K): AppSettings[K] {
    return this.data.settings[category]
  }

  getSetting(keyPath: string): unknown {
    const parts = splitSettingsKeyPath(keyPath)
    let target: unknown = this.data.settings
    for (const part of parts) {
      if (target == null || typeof target !== 'object') return undefined
      target = (target as Record<string, unknown>)[part]
    }
    return target
  }

  setSetting(keyPath: string, value: unknown): void {
    const parts = splitSettingsKeyPath(keyPath)
    let target: Record<string, unknown> = this.data.settings as unknown as Record<string, unknown>
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const next = target[part]
      if (next === undefined) {
        target[part] = {}
      } else if (next === null || typeof next !== 'object') {
        throw new Error(
          `Cannot set '${keyPath}': intermediate '${parts.slice(0, i + 1).join('.')}' is not an object (got ${next === null ? 'null' : typeof next})`,
        )
      }
      target = target[part] as Record<string, unknown>
    }
    target[parts[parts.length - 1]] = value
    this.save()
    this.notifyListeners(keyPath, value)
  }

  resetCategory(category: keyof AppSettings): void {
    (this.data.settings as any)[category] = (defaultSettings as any)[category]
    this.save()
    this.notifyListeners(category, (this.data.settings as any)[category])
  }

  onSettingsChanged(listener: SettingsListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(key: string, value: unknown): void {
    for (const listener of this.listeners) {
      listener(key, value)
    }
  }
}
