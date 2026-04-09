import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex, DatabaseType } from './types'
import type { AppSettings } from './settings'

export interface IpcChannelMap {
  'db:connect': {
    args: [profileId: string]
    return: { success: boolean; error?: string }
  }
  'db:disconnect': {
    args: [profileId: string]
    return: void
  }
  'db:query': {
    args: [profileId: string, sql: string, params?: unknown[]]
    return: QueryResult
  }
  'db:test-connection': {
    args: [profile: ConnectionProfile]
    return: { success: boolean; error?: string; version?: string }
  }
  'db:get-tables': {
    args: [profileId: string, schema?: string]
    return: SchemaTable[]
  }
  'db:get-columns': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaColumn[]
  }
  'db:get-indexes': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaIndex[]
  }
  'db:get-schemas': {
    args: [profileId: string]
    return: string[]
  }
  'db:get-databases': {
    args: [profileId: string]
    return: string[]
  }
  'db:get-row-count': {
    args: [profileId: string, table: string, schema?: string]
    return: number
  }
  'db:switch-database': {
    args: [profileId: string, database: string]
    return: void
  }
  'connections:list': {
    args: []
    return: ConnectionProfile[]
  }
  'connections:save': {
    args: [profile: ConnectionProfile]
    return: ConnectionProfile
  }
  'connections:delete': {
    args: [profileId: string]
    return: void
  }
  'db:set-schema': {
    args: [profileId: string, schema: string]
    return: void
  }
  'db:cancel-query': {
    args: [profileId: string]
    return: void
  }
  'db:get-table-names': {
    args: [profileId: string, schema?: string]
    return: string[]
  }
  'export:table': {
    args: [profileId: string, tableName: string, format: 'sql' | 'csv' | 'json', options?: { schema?: string; includeSchema?: boolean }]
    return: { filePath: string } | { cancelled: true }
  }
  'export:query-result': {
    args: [rows: Record<string, unknown>[], fields: string[], format: 'csv' | 'json']
    return: { filePath: string } | { cancelled: true }
  }
  'import:csv': {
    args: [profileId: string, tableName: string, columnMapping: Record<string, string>, onConflict: 'skip' | 'update' | 'error']
    return: { inserted: number; skipped: number; errors: string[] } | { cancelled: true }
  }
  'import:sql': {
    args: [profileId: string]
    return: { executed: number; errors: string[] } | { cancelled: true }
  }
  'migration:type-map': {
    args: [sourceType: string, from: DatabaseType, to: DatabaseType]
    return: { source: string; target: string; lossy: boolean; note?: string }
  }
  'migration:generate-ddl': {
    args: [tableName: string, columns: { name: string; dataType: string; nullable: boolean; isPrimaryKey: boolean; defaultValue: string | null }[], from: DatabaseType, to: DatabaseType]
    return: { ddl: string; mappings: { source: string; target: string; lossy: boolean; note?: string }[] }
  }
  'plugins:list': {
    args: []
    return: {
      name: string
      displayName: string
      version: string
      description: string
      bundled: boolean
      status: { state: string; error?: string; phase?: string; contributions?: string[] }
      contributions: string[]
    }[]
  }
  'plugins:activate': {
    args: [name: string]
    return: { success: boolean; error?: string }
  }
  'plugins:deactivate': {
    args: [name: string]
    return: void
  }
  'plugins:install-from-path': {
    args: [path: string]
    return: { success: boolean; name?: string; error?: string }
  }
  'plugins:uninstall': {
    args: [name: string]
    return: void
  }
  'plugins:errors': {
    args: [name: string]
    return: { timestamp: number; error: string; stack?: string }[]
  }
  'plugins:connection-fields': {
    args: []
    return: { driverId: string; driverName: string; connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[] }[]
  }
  'plugins:middleware-fields': {
    args: []
    return: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
  }
  'settings:get-all': {
    args: []
    return: AppSettings
  }
  'settings:get': {
    args: [category: string]
    return: unknown
  }
  'settings:set': {
    args: [keyPath: string, value: unknown]
    return: void
  }
  'settings:reset': {
    args: [category: string]
    return: unknown
  }
}
