import { create } from 'zustand'
import { useSettingsStore } from './settings'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
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
  expandedSections: {
    CONNECTIONS: true,
    DATABASES: true,
    TABLES: true,
    VIEWS: true,
  },
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true,
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => {
    const clamped = Math.min(480, Math.max(180, width))
    useSettingsStore.getState().set('appearance.sidebarWidth', clamped)
  },
  setSplitRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, ratio))
    useSettingsStore.getState().set('appearance.splitRatio', clamped)
  },
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title],
      },
    })),
}))
