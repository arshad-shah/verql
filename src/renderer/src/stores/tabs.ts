import { create } from 'zustand'
import type { Tab, QueryTab, QueryResult } from '@shared/types'

let tabCounter = 0

function createQueryTab(connectionId: string | null, schema: string | null = null): QueryTab {
  tabCounter++
  return {
    id: `query-${tabCounter}-${Date.now()}`,
    type: 'query',
    title: `Query ${tabCounter}`,
    connectionId,
    schema,
    sql: '',
    results: null,
    isExecuting: false,
    error: null
  }
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  addQueryTab: (connectionId: string | null, schema?: string | null) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabSql: (id: string, sql: string) => void
  setTabConnection: (id: string, connectionId: string) => void
  setTabSchema: (id: string, schema: string) => void
  setTabExecuting: (id: string, executing: boolean) => void
  setTabResults: (id: string, results: QueryResult) => void
  setTabError: (id: string, error: string) => void
  openErDiagram: (connectionId: string, schema: string) => string
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addQueryTab: (connectionId, schema = null) => {
    const tab = createQueryTab(connectionId, schema)
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id
    }))
    return tab.id
  },

  closeTab: (id) => {
    set((s) => {
      const remaining = s.tabs.filter(t => t.id !== id)
      let nextActive = s.activeTabId
      if (s.activeTabId === id) {
        const idx = s.tabs.findIndex(t => t.id === id)
        nextActive = remaining[Math.min(idx, remaining.length - 1)]?.id ?? null
      }
      return { tabs: remaining, activeTabId: nextActive }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabSql: (id, sql) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, sql } : t)
    }))
  },

  setTabConnection: (id, connectionId) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, connectionId } : t)
    }))
  },

  setTabSchema: (id, schema) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, schema } : t)
    }))
  },

  setTabExecuting: (id, executing) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, isExecuting: executing, ...(executing ? { error: null } : {}) }
          : t
      )
    }))
  },

  setTabResults: (id, results) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, results, isExecuting: false, error: null }
          : t
      )
    }))
  },

  setTabError: (id, error) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, error, isExecuting: false }
          : t
      )
    }))
  },

  openErDiagram: (connectionId: string, schema: string) => {
    const id = `er-${connectionId}-${schema}`
    const existing = get().tabs.find(t => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: import('@shared/types').ErDiagramTab = {
      id,
      type: 'er-diagram',
      title: `ER: ${schema}`,
      connectionId,
      schema
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id
    }))
    return id
  }
}))
