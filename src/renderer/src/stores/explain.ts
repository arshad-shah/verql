import { create } from 'zustand'

interface ExplainState {
  loading: Record<string, boolean>
  setLoading: (tabId: string, value: boolean) => void
}

export const useExplainStore = create<ExplainState>((set) => ({
  loading: {},
  setLoading: (tabId, value) =>
    set((s) => ({ loading: { ...s.loading, [tabId]: value } })),
}))
