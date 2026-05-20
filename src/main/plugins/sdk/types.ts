// src/main/plugins/sdk/types.ts
import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'
import type { DbAdapter } from '../../db/adapter'
import type { UIRegistry } from './ui-registry'
import type { CompletionRegistry } from './completion-registry'
import type { AIAccess } from './ai-access'

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
  ui: UIRegistry
  completions: CompletionRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  keyring: KeyringAccess
  ai: AIAccess
  ipc: PluginIpc
  broadcast: BroadcastFn
  services: import('./service-registry').ServiceRegistry
  exporters: PluginExporterAccess
  importers: PluginImporterAccess
  typeMappers: PluginTypeMapperAccess
  /** Bundled/trusted plugins occasionally need raw access to top-level app
   *  settings (e.g. `ai.activeProvider`) rather than their own namespaced
   *  scope under `plugins.<name>.*`. */
  rootSettings: { get(key: string): unknown; set(key: string, value: unknown): void }
  subscriptions: Disposable[]
}

export interface PluginExporterAccess {
  register(
    id: string,
    exporter: import('./exporter-registry').RegisteredExporter
  ): Disposable
}

export interface PluginImporterAccess {
  register(
    id: string,
    importer: import('./importer-registry').RegisteredImporter
  ): Disposable
}

export interface PluginTypeMapperAccess {
  register(
    from: string,
    to: string,
    table: Record<string, import('./type-mapper-registry').TypeMappingEntry>,
    fallback?: import('./type-mapper-registry').TypeMappingFallback
  ): Disposable
}

/** Lets a plugin own typed IPC channels in main → renderer direction. */
export interface PluginIpc {
  handle<K extends keyof import('@shared/ipc').IpcChannelMap>(
    channel: K,
    handler: (...args: import('@shared/ipc').IpcChannelMap[K]['args']) =>
      | import('@shared/ipc').IpcChannelMap[K]['return']
      | Promise<import('@shared/ipc').IpcChannelMap[K]['return']>
  ): Disposable
}

/** Sends an event from main to all renderer windows. */
export type BroadcastFn = (channel: string, ...args: unknown[]) => void

// ─── Driver Registry ─────────────────────────────────────────────────────────

export interface DriverRegistry {
  register(id: string, factory: DriverFactory): Disposable
  registerConnectionMiddleware(id: string, middleware: ConnectionMiddleware): Disposable
}

export interface DriverFactory {
  createAdapter(config: Record<string, unknown>): DbAdapter
  connectionFields: ConnectionField[]
  /** SQL dialect this driver speaks, if any. Lets shared SQL builders (e.g.
   *  the CSV-into-table importer) pick the right identifier quoting and
   *  placeholder syntax without the orchestrator hardcoding a type→dialect
   *  table. Non-SQL drivers (mongo, redis) leave this undefined. */
  sqlDialect?: 'postgresql' | 'mysql' | 'sqlite' | 'snowflake'
  /** Monaco editor language used for queries against this driver. Defaults to
   *  'sql' when omitted. The renderer never branches on connection type. */
  editorLanguage?: string
  /** When true, prefer the connection's `database` field as the default
   *  schema in the renderer (MySQL semantics: schemas == databases). */
  defaultSchemaUseConnectionDatabase?: boolean
  /** Ordered list of schema names the renderer should try when picking a
   *  default. First match in the live schema list wins. Examples:
   *  postgres ⇒ ['public']; sqlite ⇒ ['main']; snowflake ⇒ ['PUBLIC', 'public']. */
  defaultSchemaCandidates?: string[]
  /** Returns a sample/preview query for a table. Used by the explorer "Open in tab" action. */
  sampleQuery?(table: string, schema?: string): string
  /** Reads every row of a table/collection for export. The driver decides how
   *  (SQL SELECT, Mongo find, Redis SCAN, …); the orchestrator never assumes
   *  the source is a relational database. Must use safe identifier escaping
   *  for whichever query language it speaks. */
  getTableData?(adapter: DbAdapter, table: string, schema?: string): Promise<{
    rows: Record<string, unknown>[]
    columns: SchemaColumn[]
  }>
}

/** Serialisable subset of DriverFactory that the renderer can consume over
 *  IPC. Functions are stripped — the renderer only needs the data-driven
 *  capability flags to make UI decisions. */
export interface DriverCapabilities {
  sqlDialect?: DriverFactory['sqlDialect']
  editorLanguage?: string
  defaultSchemaUseConnectionDatabase?: boolean
  defaultSchemaCandidates?: string[]
  hasSampleQuery: boolean
  hasGetTableData: boolean
}

export interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'file-path' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean
  step?: number
  /** Static options for non-fetchable select fields */
  options?: { value: string; label: string }[]
}

export interface ConnectionMiddleware {
  shouldApply(profile: ConnectionProfile): boolean
  beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile>
  onDisconnect(profileId: string): Promise<void>
}

// ─── Command Registry ────────────────────────────────────────────────────────

export interface CommandRegistry {
  register(id: string, handler: (payload?: Record<string, unknown>) => void | Promise<void>): Disposable
}

// ─── Panel Registry ──────────────────────────────────────────────────────────

export interface PanelRegistry {
  register(id: string, panel: PanelContribution): Disposable
}

export interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'secondary' | 'bottom'
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
  /** Sync read used on hot paths (e.g. API key on each request). The single
   *  source of truth is the in-memory cache loaded at startup. */
  retrieveSync(profileId: string, key: string): string | null
  storeSync(profileId: string, key: string, value: string): void
  has(profileId: string, key: string): boolean
  /** Returns all stored key names for a profile (field portion of `profileId:key`). */
  listKeys(profileId: string): string[]
}

// ─── Boot Report ─────────────────────────────────────────────────────────────

export interface BootReport {
  total: number
  active: number
  degraded: number
  failed: number
  plugins: { name: string; status: PluginStatus; durationMs: number }[]
}
