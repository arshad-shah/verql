import { create } from 'zustand'
import { useSettingsStore } from './settings'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings' | (string & {})

export type SecondaryPanelId = 'inspector' | 'notifications' | 'connections' | (string & {})
export type BottomPanelId = 'results' | (string & {})

export type SettingsCategoryId =
  | 'general' | 'appearance' | 'editor' | 'connections'
  | 'data-display' | 'keybindings' | 'ai' | 'mcp' | 'plugins'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedTreeNodes: Set<string>
  /** Which settings category is shown in the editor area when activePanel === 'settings'. */
  activeSettingsCategory: SettingsCategoryId
  setActivePanel: (panel: ActivityPanel) => void
  setActiveSettingsCategory: (category: SettingsCategoryId) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  toggleTreeNode: (path: string) => void
  expandTreeNode: (path: string) => void
  collapseAllTreeNodes: () => void
  // Secondary sidebar (right)
  secondarySidebarVisible: boolean
  secondaryActivePanel: SecondaryPanelId
  setSecondaryActivePanel: (panel: SecondaryPanelId) => void
  toggleSecondarySidebar: () => void
  setSecondarySidebarWidth: (width: number) => void
  // Bottom dock
  bottomDockVisible: boolean
  bottomDockActivePanel: BottomPanelId
  setBottomDockActivePanel: (panel: BottomPanelId) => void
  toggleBottomDock: () => void
  setBottomDockHeight: (height: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  expandedTreeNodes: new Set<string>(),
  activeSettingsCategory: 'general',
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true,
    })),
  setActiveSettingsCategory: (category) => set({ activeSettingsCategory: category }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => {
    const clamped = Math.min(480, Math.max(180, width))
    useSettingsStore.getState().set('appearance.sidebarWidth', clamped)
  },
  setSplitRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, ratio))
    useSettingsStore.getState().set('appearance.splitRatio', clamped)
  },
  toggleTreeNode: (path) =>
    set((state) => {
      const next = new Set(state.expandedTreeNodes)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedTreeNodes: next }
    }),
  expandTreeNode: (path) =>
    set((state) => {
      if (state.expandedTreeNodes.has(path)) return {}
      const next = new Set(state.expandedTreeNodes)
      next.add(path)
      return { expandedTreeNodes: next }
    }),
  collapseAllTreeNodes: () => set({ expandedTreeNodes: new Set<string>() }),
  secondarySidebarVisible: useSettingsStore.getState().settings.appearance.showSecondarySidebar,
  secondaryActivePanel: 'inspector',
  setSecondaryActivePanel: (panel) =>
    set((state) => ({
      secondaryActivePanel: panel,
      secondarySidebarVisible:
        state.secondaryActivePanel === panel ? !state.secondarySidebarVisible : true,
    })),
  toggleSecondarySidebar: () =>
    set((state) => ({ secondarySidebarVisible: !state.secondarySidebarVisible })),
  setSecondarySidebarWidth: (width) => {
    const clamped = Math.min(640, Math.max(220, width))
    useSettingsStore.getState().set('appearance.secondarySidebarWidth', clamped)
  },
  bottomDockVisible: useSettingsStore.getState().settings.appearance.showBottomDock,
  bottomDockActivePanel: 'results',
  setBottomDockActivePanel: (panel) =>
    set((state) => ({
      bottomDockActivePanel: panel,
      bottomDockVisible:
        state.bottomDockActivePanel === panel ? !state.bottomDockVisible : true,
    })),
  toggleBottomDock: () =>
    set((state) => ({ bottomDockVisible: !state.bottomDockVisible })),
  setBottomDockHeight: (height) => {
    const clamped = Math.min(640, Math.max(120, height))
    useSettingsStore.getState().set('appearance.bottomDockHeight', clamped)
  },
}))
