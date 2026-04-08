import { create } from 'zustand'

export type ActivityPanel = 'explorer' | 'query' | 'schema' | 'charts' | 'extensions' | 'settings'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible }))
}))
