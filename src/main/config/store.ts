import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'

interface ConfigData {
  connections: ConnectionProfile[]
}

export class ConfigStore {
  private filePath: string
  private data: ConfigData

  constructor(filePath: string) {
    this.filePath = filePath
    this.data = this.load()
  }

  private load(): ConfigData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { connections: [] }
  }

  private save(): void {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

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
}
