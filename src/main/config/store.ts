import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'
import type { AppSettings } from '@shared/settings'
import { defaultSettings, mergeWithDefaults } from '@shared/settings'
import {
  extractAndPersistSecrets,
  injectSecretsFromKeyring,
  deleteProfileSecrets,
  stripSecretsForDisk,
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

// Atomic save: write to a sibling temp file, then rename onto the final
// path. The rename is atomic on POSIX (and `MoveFileEx`-style on
// Windows), so a crash mid-save leaves either the old file or the new
// file fully readable — never a half-written JSON that fails to parse
// on next launch and drops every saved profile.
function writeAtomic(filePath: string, contents: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`)
  try {
    fs.writeFileSync(tmpPath, contents, 'utf-8')
    fs.renameSync(tmpPath, filePath)
  } catch (err) {
    try { fs.unlinkSync(tmpPath) } catch { /* ignore — temp file may not exist */ }
    throw err
  }
}

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
    // Always strip keyring-backed secrets before serialising. `this.data`
    // holds plaintext in memory; writing it verbatim would leak every
    // connection's password into config.json whenever an unrelated change
    // (settings, delete) triggers a save.
    const diskData = {
      connections: this.data.connections.map(c => stripSecretsForDisk(c, this.keyring)),
      settings: this.data.settings,
    }
    writeAtomic(this.filePath, JSON.stringify(diskData, null, 2))
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
    let inMemory: ConnectionProfile

    if (secretKeys) {
      // Push secrets into the keyring; the in-memory copy stays plaintext-complete.
      // `save()` blanks every keyring-backed field before it touches disk.
      const onDisk = extractAndPersistSecrets(profile, secretKeys, this.keyring)
      inMemory = injectSecretsFromKeyring(onDisk, this.keyring)
    } else {
      inMemory = profile
    }

    // Update in-memory store (plaintext)
    const idx = this.data.connections.findIndex(c => c.id === profile.id)
    if (idx >= 0) {
      this.data.connections[idx] = inMemory
    } else {
      this.data.connections.push(inMemory)
    }

    // Persist the whole config; secrets are stripped inside save().
    this.save()
    return inMemory
  }

  async deleteConnection(id: string): Promise<void> {
    await deleteProfileSecrets(id, this.keyring)
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
    const leafKey = parts[parts.length - 1]
    // Skip a full-file rewrite (and listener churn) when the value is
    // unchanged. setSetting is the renderer's high-frequency path (layout
    // prefs, toggles re-applied to the same value), and each write rewrites
    // the whole connections+settings file synchronously on the main thread.
    if (Object.is(target[leafKey], value)) return
    target[leafKey] = value
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
