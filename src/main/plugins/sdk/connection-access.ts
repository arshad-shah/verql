import type { ConnectionAccess, Disposable } from './types'
import type { ConnectionProfile, QueryResult } from '@shared/types'
import type { DbAdapter } from '../../db/adapter'

export class ConnectionAccessImpl implements ConnectionAccess {
  private activeConnectionId: string | null = null
  private listeners = new Set<(id: string | null) => void>()

  constructor(
    private getAdapter: (connectionId: string) => DbAdapter | undefined,
    private getProfileFn: (connectionId: string) => ConnectionProfile | undefined
  ) {}

  getActiveConnectionId(): string | null {
    return this.activeConnectionId
  }

  setActiveConnectionId(id: string | null): void {
    this.activeConnectionId = id
    for (const listener of this.listeners) {
      listener(id)
    }
  }

  getProfile(connectionId: string): ConnectionProfile | null {
    return this.getProfileFn(connectionId) ?? null
  }

  async query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult> {
    const adapter = this.getAdapter(connectionId)
    if (!adapter) throw new Error(`No active connection: ${connectionId}`)
    return adapter.query(sql, params)
  }

  cancelQuery(connectionId: string): void {
    const adapter = this.getAdapter(connectionId)
    adapter?.cancelQuery?.()
  }

  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable {
    this.listeners.add(listener)
    return { dispose: () => { this.listeners.delete(listener) } }
  }
}
