import { create } from 'zustand'
import type { ConnectionProfile } from '@shared/types'

interface ConnectionsState {
  connections: ConnectionProfile[]
  activeConnectionId: string | null
  connectedIds: Set<string>
  loading: boolean
  setActiveConnection: (id: string | null) => void
  loadConnections: () => Promise<void>
  saveConnection: (profile: ConnectionProfile) => Promise<void>
  deleteConnection: (id: string) => Promise<void>
  connect: (id: string) => Promise<{ success: boolean; error?: string }>
  disconnect: (id: string) => Promise<void>
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  connectedIds: new Set(),
  loading: false,
  setConnections: (connections) => set({ connections }),
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  addConnected: (id) => set((s) => ({ connectedIds: new Set([...s.connectedIds, id]) })),
  removeConnected: (id) => set((s) => {
    const next = new Set(s.connectedIds)
    next.delete(id)
    return { connectedIds: next }
  }),
  setLoading: (loading) => set({ loading }),
  loadConnections: async () => {
    set({ loading: true })
    const connections = await window.electronAPI.invoke('connections:list')
    set({ connections, loading: false })
  },
  saveConnection: async (profile) => {
    await window.electronAPI.invoke('connections:save', profile)
    await get().loadConnections()
  },
  deleteConnection: async (id) => {
    await window.electronAPI.invoke('connections:delete', id)
    const state = get()
    if (state.activeConnectionId === id) set({ activeConnectionId: null })
    await state.loadConnections()
  },
  connect: async (id) => {
    const result = await window.electronAPI.invoke('db:connect', id)
    if (result.success) {
      get().addConnected(id)
      set({ activeConnectionId: id })
    }
    return result
  },
  disconnect: async (id) => {
    await window.electronAPI.invoke('db:disconnect', id)
    get().removeConnected(id)
    if (get().activeConnectionId === id) set({ activeConnectionId: null })
  }
}))
