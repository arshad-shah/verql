import { create } from 'zustand'

export interface ColumnMeta {
  name: string
  dataType: string
  nullable?: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

export type Selection =
  | { kind: 'row'; tabId: string; row: Record<string, unknown>; columns: ColumnMeta[] }
  | { kind: 'table'; connectionId: string; schema?: string; table: string }
  | { kind: 'erNode'; connectionId: string; schema?: string; table: string }
  | null

interface SelectionState {
  selection: Selection
  setSelection: (s: Selection) => void
  clearForTab: (tabId: string) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
  clearForTab: (tabId) =>
    set((state) => {
      if (state.selection?.kind === 'row' && state.selection.tabId === tabId) {
        return { selection: null }
      }
      return {}
    }),
}))
