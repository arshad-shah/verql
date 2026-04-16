import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'
import type { AppSettings } from '@shared/settings'
import { defaultSettings, mergeWithDefaults } from '@shared/settings'

interface ConfigData {
  connections: ConnectionProfile[]
  settings: AppSettings
}

type SettingsListener = (key: string, value: unknown) => void

export class ConfigStore {
  private filePath: string
  private data: ConfigData
  private listeners: SettingsListener[] = []

  constructor(filePath: string) {
    this.filePath = filePath
    this.data = this.load()
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

  saveConnection(profile: ConnectionProfile): ConnectionProfile {
    const idx = this.data.connections.findIndex(c => c.id === profile.id)
    if (idx >= 0) {
      this.data.connections[idx] = profile
    } else {
      this.data.connections.push(profile)
    }
    this.save()
    return profile
  }

  deleteConnection(id: string): void {
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
    const parts = keyPath.split('.')
    let target: any = this.data.settings
    for (const part of parts) {
      if (target == null || typeof target !== 'object') return undefined
      target = target[part]
    }
    return target
  }

  setSetting(keyPath: string, value: unknown): void {
    const parts = keyPath.split('.')
    let target: any = this.data.settings
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] === undefined) target[parts[i]] = {}
      target = target[parts[i]]
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
