import { create } from 'zustand'
import { useSettingsStore } from './settings'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings' | (string & {})

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedTreeNodes: Set<string>
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  toggleTreeNode: (path: string) => void
  expandTreeNode: (path: string) => void
  collapseAllTreeNodes: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  expandedTreeNodes: new Set<string>(),
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
}))
