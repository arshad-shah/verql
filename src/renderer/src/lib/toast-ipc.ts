/**
 * Plugin notifications bus → toasts. Plugins call `ctx.notifications.show(…)`
 * in the main process; the host broadcasts `notifications:show` to every
 * renderer window, where we materialise it as a Sonner toast (Cynosure's
 * Toaster renders them). Imported for its side effect from App.tsx, next to
 * the <Toaster/> mount.
 */
import { toast } from '@arshad-shah/cynosure-react/toast'
import { IPC_EVENTS } from '@shared/ipc'

if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on(IPC_EVENTS.NOTIFICATIONS_SHOW, (payload) => {
    if (!payload || typeof payload !== 'object') return
    const { kind, title, message } = payload as { kind?: string; title?: string; message?: string }
    if (!title) return
    const fn = kind === 'error' ? toast.error : kind === 'success' ? toast.success : toast.info
    fn(title, { description: message })
  })
}

export {}
