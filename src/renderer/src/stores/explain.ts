import { create } from 'zustand'

interface PerTab {
  loading: boolean
  streamingText: string
  streamId: string | null
  model: string | null
  durationMs: number | null
  error: string | null
}

interface ExplainState {
  byTab: Record<string, PerTab>
  setLoading(tabId: string, value: boolean): void
  startStream(tabId: string, streamId: string, model: string): void
  appendToken(tabId: string, text: string): void
  finishStream(tabId: string, durationMs: number): void
  failStream(tabId: string, message: string): void
  resetTab(tabId: string): void
}

const empty: PerTab = {
  loading: false, streamingText: '', streamId: null, model: null,
  durationMs: null, error: null,
}

function patch(s: ExplainState, tabId: string, p: Partial<PerTab>): { byTab: Record<string, PerTab> } {
  const prev = s.byTab[tabId] ?? empty
  return { byTab: { ...s.byTab, [tabId]: { ...prev, ...p } } }
}

export const useExplainStore = create<ExplainState>((set) => ({
  byTab: {},
  setLoading(tabId, value) { set((s) => patch(s, tabId, { loading: value })) },
  startStream(tabId, streamId, model) {
    set((s) => patch(s, tabId, {
      loading: true, streamingText: '', streamId, model,
      durationMs: null, error: null,
    }))
  },
  appendToken(tabId, text) {
    set((s) => patch(s, tabId, { streamingText: (s.byTab[tabId]?.streamingText ?? '') + text }))
  },
  finishStream(tabId, durationMs) {
    set((s) => patch(s, tabId, { loading: false, streamId: null, durationMs }))
  },
  failStream(tabId, message) {
    set((s) => patch(s, tabId, { loading: false, streamId: null, error: message }))
  },
  resetTab(tabId) {
    set((s) => ({ byTab: { ...s.byTab, [tabId]: empty } }))
  },
}))
