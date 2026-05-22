import { create } from 'zustand'
import { IPC_EVENTS } from '@shared/ipc'

export interface Toast {
  id: string
  type: 'error' | 'success' | 'info'
  title: string
  message?: string
  /** If true, toast stays until manually dismissed or updated */
  persistent?: boolean
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'> & { id?: string }) => string
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void
  removeToast: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = toast.id ?? String(++nextId)
    set((state) => ({
      toasts: [...state.toasts.filter((t) => t.id !== id), { ...toast, id }],
    }))
    if (!toast.persistent) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, 5000)
    }
    return id
  },
  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
    // If updated to non-persistent, auto-dismiss
    if (updates.persistent === false) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, 4000)
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// Plugin notifications bus → toasts. Plugins call `ctx.notifications.show(…)`
// in the main process; the host broadcasts `notifications:show` to every
// renderer window, where we materialise it as a toast. Kept here so any
// component that renders <ToastContainer/> picks it up without needing to
// register its own subscriber.
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on(IPC_EVENTS.NOTIFICATIONS_SHOW, (payload) => {
    if (!payload || typeof payload !== 'object') return
    const { kind, title, message } = payload as { kind?: string; title?: string; message?: string }
    if (!title) return
    const type: Toast['type'] =
      kind === 'error' ? 'error' : kind === 'success' ? 'success' : 'info'
    useToastStore.getState().addToast({ type, title, message })
  })
}
