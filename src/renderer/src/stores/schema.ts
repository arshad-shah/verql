import { create } from 'zustand'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

interface SchemaState {
  tables: Map<string, SchemaTable[]>
  columns: Map<string, SchemaColumn[]>
  indexes: Map<string, SchemaIndex[]>
  schemas: Map<string, string[]>
  databases: Map<string, string[]>
  expandedTables: Set<string>
  filterText: string
  rowCounts: Map<string, number>
  loading: boolean
  /** Incremented on clearCache — lets components know to re-fetch */
  cacheVersion: number

  fetchDatabases: (connectionId: string) => Promise<string[]>
  fetchSchemas: (connectionId: string) => Promise<string[]>
  fetchTables: (connectionId: string, schema: string) => Promise<SchemaTable[]>
  fetchColumns: (connectionId: string, table: string, schema: string) => Promise<SchemaColumn[]>
  fetchIndexes: (connectionId: string, table: string, schema: string) => Promise<SchemaIndex[]>
  toggleTable: (key: string) => void
  clearCache: (connectionId?: string) => void
  setFilterText: (text: string) => void
  fetchRowCount: (connectionId: string, table: string, schema: string) => Promise<void>
}

function cacheKey(connectionId: string, ...parts: string[]): string {
  return [connectionId, ...parts].join(':')
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  tables: new Map(),
  columns: new Map(),
  indexes: new Map(),
  schemas: new Map(),
  databases: new Map(),
  expandedTables: new Set(),
  filterText: '',
  rowCounts: new Map(),
  loading: false,
  cacheVersion: 0,

  fetchDatabases: async (connectionId) => {
    const key = connectionId
    const cached = get().databases.get(key)
    if (cached) return cached
    const result = await window.electronAPI.invoke('db:get-databases', connectionId)
    set((s) => {
      const next = new Map(s.databases)
      next.set(key, result)
      return { databases: next }
    })
    return result
  },

  fetchSchemas: async (connectionId) => {
    const key = connectionId
    const cached = get().schemas.get(key)
    if (cached) return cached
    set({ loading: true })
    const result = await window.electronAPI.invoke('db:get-schemas', connectionId)
    set((s) => {
      const next = new Map(s.schemas)
      next.set(key, result)
      return { schemas: next, loading: false }
    })
    return result
  },

  fetchTables: async (connectionId, schema) => {
    const key = cacheKey(connectionId, schema)
    const cached = get().tables.get(key)
    if (cached) return cached
    set({ loading: true })
    const result = await window.electronAPI.invoke('db:get-tables', connectionId, schema)
    set((s) => {
      const next = new Map(s.tables)
      next.set(key, result)
      return { tables: next, loading: false }
    })
    return result
  },

  fetchColumns: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    const cached = get().columns.get(key)
    if (cached) return cached
    const result = await window.electronAPI.invoke('db:get-columns', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.columns)
      next.set(key, result)
      return { columns: next }
    })
    return result
  },

  fetchIndexes: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    const cached = get().indexes.get(key)
    if (cached) return cached
    const result = await window.electronAPI.invoke('db:get-indexes', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.indexes)
      next.set(key, result)
      return { indexes: next }
    })
    return result
  },

  toggleTable: (key) => {
    set((s) => {
      const next = new Set(s.expandedTables)
      if (next.has(key)) next.delete(key); else next.add(key)
      return { expandedTables: next }
    })
  },

  setFilterText: (text) => set({ filterText: text }),

  fetchRowCount: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    if (get().rowCounts.has(key)) return
    const count = await window.electronAPI.invoke('db:get-row-count', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.rowCounts)
      next.set(key, count)
      return { rowCounts: next }
    })
  },

  clearCache: (connectionId) => {
    if (!connectionId) {
      set((s) => ({ tables: new Map(), columns: new Map(), indexes: new Map(), schemas: new Map(), databases: new Map(), rowCounts: new Map(), filterText: '', cacheVersion: s.cacheVersion + 1 }))
      return
    }
    set((s) => {
      const filterMap = <T,>(m: Map<string, T>) => {
        const next = new Map<string, T>()
        for (const [k, v] of m) if (!k.startsWith(connectionId)) next.set(k, v)
        return next
      }
      return {
        tables: filterMap(s.tables),
        columns: filterMap(s.columns),
        indexes: filterMap(s.indexes),
        schemas: filterMap(s.schemas),
        databases: filterMap(s.databases),
        rowCounts: filterMap(s.rowCounts),
        cacheVersion: s.cacheVersion + 1
      }
    })
  }
}))
