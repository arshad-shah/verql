export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | (string & {})

export interface ConnectionProfile {
  id: string
  name: string
  type: DatabaseType
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  ssl?: boolean
  color?: string
  group?: string
  queryTimeout?: number
  readOnly?: boolean
}

export interface FieldInfo {
  name: string
  dataType: string
  nullable: boolean
}

export interface QueryResult {
  rows: Record<string, unknown>[]
  fields: FieldInfo[]
  rowCount: number
  duration: number
  affectedRows: number
}

export interface SchemaTable {
  name: string
  schema: string
  type: 'table' | 'view'
  rowCount?: number
}

export interface SchemaColumn {
  name: string
  dataType: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: { table: string; column: string }
}

export interface SchemaIndex {
  name: string
  columns: string[]
  unique: boolean
}

export interface TestConnectionResult {
  version: string
  details?: Record<string, string>
}

export interface QueryTab {
  id: string
  type: 'query'
  title: string
  connectionId: string | null
  database: string | null
  schema: string | null
  sql: string
  results: QueryResult | null
  isExecuting: boolean
  error: string | null
  isDirty: boolean
}

export interface TableTab {
  id: string
  type: 'table'
  title: string
  connectionId: string
  tableName: string
  schema: string
}

export interface ErDiagramTab {
  id: string
  type: 'er-diagram'
  title: string
  connectionId: string
  schema: string
}

export interface ConnectionFormTab {
  id: string
  type: 'connection-form'
  title: string
  editingId?: string
}

export interface PluginDetailTab {
  id: string
  type: 'plugin-detail'
  title: string
  pluginName: string
}

export interface InstallPluginTab {
  id: string
  type: 'install-plugin'
  title: string
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab | PluginDetailTab | InstallPluginTab
