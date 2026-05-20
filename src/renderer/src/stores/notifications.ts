import { create } from 'zustand'

export type NotificationSource = { type: 'tab' | 'connection' | 'plugin'; id: string; label: string }

export interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message?: string
  source?: NotificationSource
  timestamp: number
  read: boolean
}

interface NotificationsState {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  unreadCount: () => number
}

const MAX_NOTIFICATIONS = 50

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],

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

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

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

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
