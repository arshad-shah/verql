import { create } from 'zustand'
import type { Tab, QueryTab, QueryResult, ConnectionFormTab, PluginDetailTab, InstallPluginTab, SettingsTab } from '@shared/types'

let tabCounter = 0

function createQueryTab(connectionId: string | null, schema: string | null = null): QueryTab {
  tabCounter++
  return {
    id: `query-${tabCounter}-${Date.now()}`,
    type: 'query',
    title: `Query ${tabCounter}`,
    connectionId,
    database: null,
    schema,
    sql: '',
    results: null,
    isExecuting: false,
    error: null,
    isDirty: false,
    aiExplanation: null
  }
}

const MAX_RECENTLY_CLOSED = 10

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  recentlyClosed: Tab[]
  addQueryTab: (connectionId: string | null, schema?: string | null) => string
  closeTab: (id: string) => void
  closeOtherTabs: (id: string) => void
  closeTabsToRight: (id: string) => void
  closeAllTabs: () => void
  setActiveTab: (id: string) => void
  updateTabSql: (id: string, sql: string) => void
  setTabDirty: (id: string, dirty: boolean) => void
  setTabConnection: (id: string, connectionId: string) => void
  setTabDatabase: (id: string, database: string) => void
  setTabSchema: (id: string, schema: string) => void
  setTabExecuting: (id: string, executing: boolean) => void
  setTabResults: (id: string, results: QueryResult) => void
  setTabError: (id: string, error: string) => void
  setTabAiExplanation: (id: string, explanation: string | null) => void
  openErDiagram: (connectionId: string, schema: string) => string
  openConnectionForm: (editingId?: string) => string
  openPluginDetail: (pluginName: string, displayName: string) => string
  openInstallPlugin: () => string
  openSettings: () => string
  reorderTabs: (fromIndex: number, toIndex: number) => void
  duplicateTab: (id: string) => string | null
  reopenTab: () => void
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  recentlyClosed: [],

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
      const closedTab = s.tabs.find(t => t.id === id)
      const remaining = s.tabs.filter(t => t.id !== id)
      let nextActive = s.activeTabId
      if (s.activeTabId === id) {
        const idx = s.tabs.findIndex(t => t.id === id)
        nextActive = remaining[Math.min(idx, remaining.length - 1)]?.id ?? null
      }
      return {
        tabs: remaining,
        activeTabId: nextActive,
        recentlyClosed: closedTab
          ? [closedTab, ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED)
          : s.recentlyClosed
      }
    })
  },

  closeOtherTabs: (id) => {
    set((s) => {
      const kept = s.tabs.filter(t => t.id === id)
      const closed = s.tabs.filter(t => t.id !== id)
      return {
        tabs: kept,
        activeTabId: id,
        recentlyClosed: [...closed.reverse(), ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED)
      }
    })
  },

  closeTabsToRight: (id) => {
    set((s) => {
      const idx = s.tabs.findIndex(t => t.id === id)
      if (idx === -1) return s
      const kept = s.tabs.slice(0, idx + 1)
      const closed = s.tabs.slice(idx + 1)
      const nextActive = kept.find(t => t.id === s.activeTabId) ? s.activeTabId : id
      return {
        tabs: kept,
        activeTabId: nextActive,
        recentlyClosed: [...closed.reverse(), ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED)
      }
    })
  },

  closeAllTabs: () => {
    set((s) => ({
      tabs: [],
      activeTabId: null,
      recentlyClosed: [...s.tabs.reverse(), ...s.recentlyClosed].slice(0, MAX_RECENTLY_CLOSED)
    }))
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabSql: (id, sql) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, sql } : t)
    }))
  },

  setTabDirty: (id, dirty) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, isDirty: dirty } : t)
    }))
  },

  setTabConnection: (id, connectionId) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, connectionId } : t)
    }))
  },

  setTabDatabase: (id, database) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, database } : t)
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
          ? { ...t, results, isExecuting: false, error: null, isDirty: false, aiExplanation: null }
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

  setTabAiExplanation: (id, explanation) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, aiExplanation: explanation }
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
  },

  openConnectionForm: (editingId?: string) => {
    const formId = editingId ? `conn-form-${editingId}` : 'conn-form-new'
    const existing = get().tabs.find(t => t.id === formId)
    if (existing) {
      set({ activeTabId: formId })
      return formId
    }
    const tab: ConnectionFormTab = {
      id: formId,
      type: 'connection-form',
      title: editingId ? 'Edit Connection' : 'New Connection',
      editingId
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id
    }))
    return tab.id
  },

  openPluginDetail: (pluginName: string, displayName: string) => {
    const id = `plugin-${pluginName}`
    const existing = get().tabs.find(t => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: PluginDetailTab = {
      id,
      type: 'plugin-detail',
      title: displayName,
      pluginName
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id
    }))
    return id
  },

  openInstallPlugin: () => {
    const id = 'install-plugin'
    const existing = get().tabs.find(t => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: InstallPluginTab = {
      id,
      type: 'install-plugin',
      title: 'Install Plugin'
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id
    }))
    return id
  },

  openSettings: () => {
    const id = 'settings'
    const existing = get().tabs.find((t) => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: SettingsTab = { id, type: 'settings', title: 'Settings' }
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }))
    return id
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((s) => {
      const tabs = [...s.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    })
  },

  duplicateTab: (id) => {
    const tab = get().tabs.find(t => t.id === id)
    if (!tab || tab.type !== 'query') return null
    const newTab = createQueryTab(tab.connectionId, tab.schema)
    newTab.title = `${tab.title} (copy)`
    newTab.database = tab.database
    newTab.sql = tab.sql
    set((s) => {
      const idx = s.tabs.findIndex(t => t.id === id)
      const tabs = [...s.tabs]
      tabs.splice(idx + 1, 0, newTab)
      return { tabs, activeTabId: newTab.id }
    })
    return newTab.id
  },

  reopenTab: () => {
    set((s) => {
      if (s.recentlyClosed.length === 0) return s
      const [tab, ...rest] = s.recentlyClosed
      return {
        tabs: [...s.tabs, tab],
        activeTabId: tab.id,
        recentlyClosed: rest
      }
    })
  }
}))
