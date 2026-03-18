import Conf from 'conf'
import { randomBytes } from 'crypto'

export type DbType = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb'

export interface Connection {
  id: string
  name: string
  type: DbType
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  ssl?: boolean
  file?: string
  connectionString?: string
  color?: string
  lastUsed?: string
  group?: string
  queryTimeout?: number
}

export interface QueryHistory {
  id: string
  connectionId: string
  sql: string
  executedAt: string
  duration?: number
  rowCount?: number
  error?: string
}

export interface SavedQuery {
  id: string
  name: string
  description?: string
  sql: string
  tags?: string[]
  connectionType?: DbType
  createdAt: string
  updatedAt: string
}

export interface AppConfig {
  configVersion: number
  connections: Connection[]
  queryHistory: QueryHistory[]
  savedQueries: SavedQuery[]
  theme: 'dark' | 'light'
  maxHistoryItems: number
  defaultLimit: number
  editorTheme: string
}

const CURRENT_CONFIG_VERSION = 2

const defaultConfig: AppConfig = {
  configVersion: CURRENT_CONFIG_VERSION,
  connections: [],
  queryHistory: [],
  savedQueries: [],
  theme: 'dark',
  maxHistoryItems: 200,
  defaultLimit: 500,
  editorTheme: 'monokai',
}

function migrateConfig(store: Conf<AppConfig>): void {
  const version = store.get('configVersion') ?? 1
  if (version < 2) {
    // v1 -> v2: ensure savedQueries exists, add queryTimeout default
    if (!store.get('savedQueries')) store.set('savedQueries', [])
    store.set('configVersion', 2)
  }
}

export const store = new Conf<AppConfig>({ projectName: 'dbterm', defaults: defaultConfig })
migrateConfig(store)

// ─── Connections ──────────────────────────────────────────────────────────────

export function getConnections(): Connection[] { return store.get('connections') ?? [] }

export function saveConnection(conn: Connection): void {
  const connections = getConnections()
  const idx = connections.findIndex((c) => c.id === conn.id)
  if (idx >= 0) connections[idx] = conn; else connections.push(conn)
  store.set('connections', connections)
}

export function deleteConnection(id: string): void {
  store.set('connections', getConnections().filter((c) => c.id !== id))
}

export function getConnection(id: string): Connection | undefined {
  return getConnections().find((c) => c.id === id)
}

export function updateLastUsed(id: string): void {
  const conn = getConnection(id)
  if (conn) saveConnection({ ...conn, lastUsed: new Date().toISOString() })
}

// ─── Query History ────────────────────────────────────────────────────────────

export function addToHistory(entry: Omit<QueryHistory, 'id'>): void {
  const history = store.get('queryHistory') ?? []
  const maxItems = store.get('maxHistoryItems') ?? 200
  const newEntry: QueryHistory = { id: `${Date.now()}-${randomBytes(3).toString('hex')}`, ...entry }
  store.set('queryHistory', [newEntry, ...history].slice(0, maxItems))
}

export function getHistory(connectionId?: string): QueryHistory[] {
  const history = store.get('queryHistory') ?? []
  return connectionId ? history.filter((h) => h.connectionId === connectionId) : history
}

export function clearHistory(connectionId?: string): void {
  if (connectionId) {
    store.set('queryHistory', getHistory().filter((h) => h.connectionId !== connectionId))
  } else {
    store.set('queryHistory', [])
  }
}

// ─── Saved Queries ────────────────────────────────────────────────────────────

export function getSavedQueries(dbType?: DbType): SavedQuery[] {
  const all = store.get('savedQueries') ?? []
  if (dbType) return all.filter((q) => !q.connectionType || q.connectionType === dbType)
  return all
}

export function saveQuery(q: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): SavedQuery {
  const queries = store.get('savedQueries') ?? []
  const now = new Date().toISOString()
  const newQ: SavedQuery = { id: randomBytes(6).toString('hex'), createdAt: now, updatedAt: now, ...q }
  store.set('savedQueries', [...queries, newQ])
  return newQ
}

export function updateSavedQuery(id: string, updates: Partial<SavedQuery>): void {
  const queries = store.get('savedQueries') ?? []
  const idx = queries.findIndex((q) => q.id === id)
  if (idx >= 0) {
    queries[idx] = { ...queries[idx], ...updates, updatedAt: new Date().toISOString() }
    store.set('savedQueries', queries)
  }
}

export function deleteSavedQuery(id: string): void {
  store.set('savedQueries', (store.get('savedQueries') ?? []).filter((q) => q.id !== id))
}
