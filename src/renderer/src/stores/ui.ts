import { create } from 'zustand'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedSections: Record<string, boolean>
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  toggleSection: (title: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
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
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title]
      }
    }))
}))
