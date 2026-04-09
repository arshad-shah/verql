import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  source?: { type: 'tab' | 'connection' | 'plugin'; id: string; label: string }
  timestamp: number
  read: boolean
}

interface NotificationsState {
  notifications: Notification[]
  panelOpen: boolean
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  togglePanel: () => void
  closePanel: () => void
  unreadCount: () => number
}

const MAX_NOTIFICATIONS = 50

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  panelOpen: false,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    }
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }))
  },

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

  closePanel: () => set({ panelOpen: false }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
