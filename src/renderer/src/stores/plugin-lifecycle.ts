import { create } from 'zustand'

export type PluginLifecycleEvent = 'activated' | 'deactivated' | 'installed' | 'uninstalled'

interface PendingChange {
  name: string
  event: PluginLifecycleEvent
}

interface PluginLifecycleState {
  /** Most recent plugin change since last restart. Null until something changes. */
  pending: PendingChange | null
  setPending: (change: PendingChange | null) => void
  restart: () => Promise<void>
  dismiss: () => void
}

export const usePluginLifecycleStore = create<PluginLifecycleState>((set) => ({
  pending: null,
  setPending: (change) => set({ pending: change }),
  restart: async () => {
    await window.electronAPI.invoke('app:restart')
  },
  dismiss: () => set({ pending: null })
}))

// Subscribe to main-process lifecycle broadcasts.
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('plugins:lifecycle', (payload: unknown) => {
    const p = payload as PendingChange | undefined
    if (p?.name && p.event) {
      usePluginLifecycleStore.setState({ pending: p })
    }
  })
}
