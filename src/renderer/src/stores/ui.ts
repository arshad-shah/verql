import { create } from 'zustand'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

function loadNumber(key: string, fallback: number): number {
  const stored = localStorage.getItem(key)
  if (stored) {
    const parsed = parseFloat(stored)
    if (!isNaN(parsed)) return parsed
  }
  return fallback
}

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  sidebarWidth: number
  splitRatio: number
  expandedSections: Record<string, boolean>
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  toggleSection: (title: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  sidebarWidth: loadNumber('dbstudio-sidebar-width', 240),
  splitRatio: loadNumber('dbstudio-split-ratio', 50),
  expandedSections: {
    CONNECTIONS: true,
    DATABASES: true,
    TABLES: true,
    VIEWS: true
  },
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => {
    const clamped = Math.min(480, Math.max(180, width))
    localStorage.setItem('dbstudio-sidebar-width', String(clamped))
    set({ sidebarWidth: clamped })
  },
  setSplitRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, ratio))
    localStorage.setItem('dbstudio-split-ratio', String(clamped))
    set({ splitRatio: clamped })
  },
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title]
      }
    }))
}))
