// Notification policy — the plugin's domain logic, kept electron-free so it can
// be unit-tested in isolation. The actual native primitive (Electron's
// `Notification`) is injected as a `NativeNotifier`, built in `native-notifier.ts`.

import type { AttentionEvent } from '../../../attention/attention-hub'

/** Severity hint passed through to the OS (maps to Electron's `urgency`). */
export type NotificationUrgency = 'low' | 'normal' | 'critical'

/** Logical grouping, used for per-category user toggles and styling. */
export type NotificationCategory = 'approval' | 'alert' | 'completion' | 'info'

/** Public request shape for the `os-notifications` service that other plugins consume. */
export interface OsNotificationRequest {
  title: string
  body?: string
  urgency?: NotificationUrgency
  category?: NotificationCategory
  /**
   * Correlation id. Passing the same id again replaces the previous
   * notification; passing it to the service handle's `close()` (or resolving
   * the matching attention request) dismisses it.
   */
  id?: string
  /** Run (in the main process) when the user activates the notification.
   *  Defaults to focusing the primary window. */
  onClick?: () => void
}

export interface OsNotificationHandle {
  close(): void
}

/**
 * High-level service exposed to other plugins via `ctx.services.consume`.
 * Lets any plugin raise a native notification without touching Electron.
 */
export interface OsNotificationService {
  /** True when the OS supports notifications and the user has them enabled. */
  isAvailable(): boolean
  notify(request: OsNotificationRequest): OsNotificationHandle
}

/** The minimal native capability the dispatcher needs; backed by Electron at runtime. */
export interface NativeNotifier {
  isSupported(): boolean
  isAnyWindowFocused(): boolean
  focusPrimaryWindow(): void
  present(opts: {
    title: string
    body?: string
    urgency?: NotificationUrgency
    onClick?: () => void
  }): NativeNotificationHandle
}

export interface NativeNotificationHandle {
  close(): void
}

/** User-controlled policy, read live from plugin settings. */
export interface NotificationSettings {
  enabled(): boolean
  onlyWhenUnfocused(): boolean
  notifyApprovals(): boolean
}

const NOOP_HANDLE: OsNotificationHandle = { close() {} }

export interface NotificationDispatcher extends OsNotificationService {
  /** Surface (or dismiss) an attention event from the host attention hub. */
  handleAttention(event: AttentionEvent): void
  /** Close any still-open notifications. */
  dispose(): void
}

export function createNotificationDispatcher(deps: {
  native: NativeNotifier
  settings: NotificationSettings
}): NotificationDispatcher {
  const { native, settings } = deps
  // Tracks live notifications by correlation id so we can de-dupe and dismiss.
  const active = new Map<string, NativeNotificationHandle>()

  function isAvailable(): boolean {
    return settings.enabled() && native.isSupported()
  }

  function dismiss(id: string): void {
    const handle = active.get(id)
    if (handle) {
      active.delete(id)
      handle.close()
    }
  }

  function notify(request: OsNotificationRequest): OsNotificationHandle {
    if (!isAvailable()) return NOOP_HANDLE
    // Don't nag the user about things happening in a window they're looking at.
    if (settings.onlyWhenUnfocused() && native.isAnyWindowFocused()) return NOOP_HANDLE

    // Replace any prior notification carrying the same id.
    if (request.id) dismiss(request.id)

    const nativeHandle = native.present({
      title: request.title,
      body: request.body,
      urgency: request.urgency,
      onClick: request.onClick ?? (() => native.focusPrimaryWindow()),
    })

    const id = request.id
    const handle: OsNotificationHandle = {
      close() {
        if (id) active.delete(id)
        nativeHandle.close()
      },
    }
    if (id) active.set(id, nativeHandle)
    return handle
  }

  function handleAttention(event: AttentionEvent): void {
    if (event.type === 'resolved') {
      dismiss(event.id)
      return
    }
    const { request } = event
    if (request.kind === 'approval') {
      if (!settings.notifyApprovals()) return
      notify({
        id: request.id,
        title: request.title,
        body: request.body,
        urgency: 'critical',
        category: 'approval',
      })
      return
    }
    notify({
      id: request.id,
      title: request.title,
      body: request.body,
      category: request.kind === 'alert' ? 'alert' : 'info',
    })
  }

  return {
    isAvailable,
    notify,
    handleAttention,
    dispose() {
      for (const handle of active.values()) handle.close()
      active.clear()
    },
  }
}
