/**
 * Friendly-error notification helper.
 *
 * Every error that reaches the user (toast + notification bell) should pass
 * through the shared classifier so we never leak "Error invoking remote
 * method 'foo:bar': …" or other IPC/driver noise to the UI. Call sites just
 * hand us the raw error and a few hints about presentation; we do the rest.
 *
 * Why two stores? Toasts are ephemeral (5s auto-dismiss); notifications
 * persist in the bell tray. Most errors deserve both — the toast so the user
 * notices, the bell so they can come back to it after running another query.
 */
import { useToastStore } from '@/stores/toast'
import { useNotificationsStore, type NotificationSource } from '@/stores/notifications'
import { parseAppError } from './db-error'

interface NotifyOptions {
  /**
   * Optional caller-supplied title. When omitted we use the parsed `title`
   * (e.g. "Column not found"). Pass a prefix when the parsed title alone
   * lacks context — "AI: Generate SQL failed" — and we'll merge them as
   * "AI: Generate SQL failed — Column not found" so the user sees both
   * the operation that failed and what went wrong with it.
   */
  titlePrefix?: string
  /** Pass-through to the persistent notifications store. */
  source?: NotificationSource
  /** Skip the toast and only add to the notifications tray. */
  silent?: boolean
  /** Skip the persistent entry and only show a toast. */
  ephemeral?: boolean
}

export function notifyError(rawError: unknown, opts: NotifyOptions = {}): void {
  const parsed = parseAppError(rawError)
  const title = opts.titlePrefix
    ? `${opts.titlePrefix} — ${parsed.title}`
    : parsed.title

  if (!opts.ephemeral) {
    useNotificationsStore.getState().addNotification({
      type: 'error',
      title,
      message: parsed.message,
      source: opts.source,
    })
  }
  if (!opts.silent) {
    useToastStore.getState().addToast({
      type: 'error',
      title,
      message: parsed.message,
    })
  }
}
