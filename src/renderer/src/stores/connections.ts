import { create } from 'zustand'
import type { ConnectionProfile } from '@shared/types'
import { useNotificationsStore } from './notifications'
import { useToastStore } from './toast'
import { useSchemaStore } from './schema'
import { useTabsStore } from './tabs'
import { IPC_CHANNELS } from '@shared/ipc'

interface ConnectionsState {
  connections: ConnectionProfile[]
  activeConnectionId: string | null
  connectedIds: Set<string>
  loading: boolean
  setConnections: (connections: ConnectionProfile[]) => void
  setActiveConnection: (id: string | null) => void
  addConnected: (id: string) => void
  removeConnected: (id: string) => void
  setLoading: (loading: boolean) => void
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
    const connections = await window.electronAPI.invoke(IPC_CHANNELS.CONNECTIONS_LIST)
    set({ connections, loading: false })
  },
  saveConnection: async (profile) => {
    await window.electronAPI.invoke(IPC_CHANNELS.CONNECTIONS_SAVE, profile)
    await get().loadConnections()
  },
  deleteConnection: async (id) => {
    await window.electronAPI.invoke(IPC_CHANNELS.CONNECTIONS_DELETE, id)
    const state = get()
    if (state.activeConnectionId === id) set({ activeConnectionId: null })
    // The schema cache and any tabs anchored to this connection now point at
    // a profile that no longer exists. Drop the cache entries and detach the
    // tabs so the next query doesn't silently fail with a generic
    // "Not connected" — the user gets a clear "pick a connection" state.
    useSchemaStore.getState().clearCache(id)
    useTabsStore.getState().detachConnection(id)
    await state.loadConnections()
  },
  connect: async (id) => {
    const conn = get().connections.find(c => c.id === id)
    const name = conn?.name ?? id
    const toast = useToastStore.getState()
    const toastId = toast.addToast({
      id: `connect-${id}`,
      type: 'info',
      title: `Connecting to ${name}...`,
      message: 'Establishing connection',
      persistent: true,
    })

    const result = await window.electronAPI.invoke(IPC_CHANNELS.DB_CONNECT, id)
    if (result.success) {
      get().addConnected(id)
      set({ activeConnectionId: id })
      toast.updateToast(toastId, {
        type: 'success',
        title: `Connected to ${name}`,
        message: undefined,
        persistent: false,
      })
      useNotificationsStore.getState().addNotification({
        type: 'success',
        title: 'Connection established',
        message: `Connected to ${name}`,
        source: { type: 'connection', id, label: name },
      })
    } else {
      toast.updateToast(toastId, {
        type: 'error',
        title: `Connection failed`,
        message: result.error ?? 'Unknown error',
        persistent: false,
      })
      useNotificationsStore.getState().addNotification({
        type: 'error',
        title: 'Connection failed',
        message: result.error ?? 'Unknown error',
        source: { type: 'connection', id, label: name },
      })
    }
    return result
  },
  disconnect: async (id) => {
    const conn = get().connections.find(c => c.id === id)
    const name = conn?.name ?? id
    const toast = useToastStore.getState()
    toast.addToast({
      id: `disconnect-${id}`,
      type: 'info',
      title: `Disconnected from ${name}`,
    })
    await window.electronAPI.invoke(IPC_CHANNELS.DB_DISCONNECT, id)
    get().removeConnected(id)
    // Drop the cached schema metadata so a re-connect re-fetches against the
    // live server instead of serving stale tables/columns from the prior
    // session — which becomes outright wrong if the user disconnected
    // *because* they pointed the profile at a different database.
    useSchemaStore.getState().clearCache(id)
    useNotificationsStore.getState().addNotification({
      type: 'info',
      title: 'Disconnected',
      message: `Disconnected from ${name}`,
      source: { type: 'connection', id, label: name },
    })
    if (get().activeConnectionId === id) set({ activeConnectionId: null })
  }
}))
