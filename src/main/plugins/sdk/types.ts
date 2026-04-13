// src/main/plugins/sdk/types.ts
import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'
import type { DbAdapter } from '../../db/adapter'

// ─── Core ────────────────────────────────────────────────────────────────────

export interface Disposable {
  dispose(): void
}

export type PluginPhase = 'discover' | 'validate' | 'resolve' | 'activate' | 'verify' | 'runtime'

export type PluginStatus =
  | { state: 'discovered' }
  | { state: 'validated' }
  | { state: 'resolved' }
  | { state: 'activating' }
  | { state: 'active'; contributions: string[] }
  | { state: 'error'; error: string; phase: PluginPhase }
  | { state: 'degraded'; error: string; contributions: string[] }
  | { state: 'inactive' }

export interface PluginErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

// ─── Plugin Context ──────────────────────────────────────────────────────────

export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  keyring: KeyringAccess
  subscriptions: Disposable[]
}

// ─── Driver Registry ─────────────────────────────────────────────────────────

export interface DriverRegistry {
  register(id: string, factory: DriverFactory): Disposable
  registerConnectionMiddleware(id: string, middleware: ConnectionMiddleware): Disposable
}

export interface DriverFactory {
  createAdapter(config: Record<string, unknown>): DbAdapter
  connectionFields: ConnectionField[]
}

export interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean
  step?: number
}

export interface ConnectionMiddleware {
  shouldApply(profile: ConnectionProfile): boolean
  beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile>
  onDisconnect(profileId: string): Promise<void>
}

// ─── Command Registry ────────────────────────────────────────────────────────

export interface CommandRegistry {
  register(id: string, handler: () => void | Promise<void>): Disposable
}

// ─── Panel Registry ──────────────────────────────────────────────────────────

export interface PanelRegistry {
  register(id: string, panel: PanelContribution): Disposable
}

export interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
  render(): string
}

// ─── Schema Access ───────────────────────────────────────────────────────────

export interface SchemaSummary {
  tables: {
    name: string
    columns: {
      name: string
      dataType: string
      isPrimaryKey: boolean
      isForeignKey: boolean
      references?: { table: string; column: string }
    }[]
  }[]
}

export interface SchemaAccess {
  getTables(connectionId: string, schema?: string): Promise<SchemaTable[]>
  getColumns(connectionId: string, table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(connectionId: string, table: string, schema?: string): Promise<SchemaIndex[]>
  getSchemas(connectionId: string): Promise<string[]>
  getDatabases(connectionId: string): Promise<string[]>
  getSchemaSummary(connectionId: string, schema?: string): Promise<SchemaSummary>
}

// ─── Connection Access ───────────────────────────────────────────────────────

export interface ConnectionAccess {
  getActiveConnectionId(): string | null
  getProfile(connectionId: string): ConnectionProfile | null
  query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult>
  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable
}

// ─── Plugin Settings ─────────────────────────────────────────────────────────

export interface PluginSettings {
  get<T>(key: string): T | undefined
  set(key: string, value: unknown): void
  onChanged(key: string, listener: (value: unknown) => void): Disposable
}

// ─── Keyring Access ─────────────────────────────────────────────────────────

export interface KeyringAccess {
  store(profileId: string, key: string, value: string): Promise<void>
  retrieve(profileId: string, key: string): Promise<string | null>
  delete(profileId: string, key: string): Promise<void>
}

// ─── Boot Report ─────────────────────────────────────────────────────────────

export interface BootReport {
  total: number
  active: number
  degraded: number
  failed: number
  plugins: { name: string; status: PluginStatus; durationMs: number }[]
}
