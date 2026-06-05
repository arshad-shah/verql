// src/main/plugins/bundled/os-notifications/index.ts
//
// Surfaces things that need the user's attention — most importantly approval
// prompts — as native OS notifications, and exposes an `os-notifications`
// service so any other plugin can raise a desktop notification too.
//
// Ownership: the host owns the *seam* (the attention hub + the service
// registry); this plugin owns the *delivery policy* (when to notify, dedupe,
// urgency, the user-facing toggles). Electron lives only in `native-notifier.ts`.

import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { ATTENTION_SERVICE_ID, type AttentionHub } from '../../../attention/attention-hub'
import { createNotificationDispatcher, type OsNotificationService } from './dispatcher'
import { createElectronNativeNotifier } from './native-notifier'

export type { OsNotificationService, OsNotificationRequest, OsNotificationHandle } from './dispatcher'

/** Service id under which the high-level notification API is published. */
export const OS_NOTIFICATIONS_SERVICE_ID = 'os-notifications'

export const manifest: PluginManifest = {
  name: 'verql-plugin-os-notifications',
  version: '1.0.0',
  displayName: 'Desktop Notifications',
  description:
    'Surface approval requests and alerts as native OS notifications, and let other plugins raise desktop notifications.',
  main: 'index.js',
  contributes: {
    settings: [
      {
        key: 'enabled',
        title: 'Show desktop notifications',
        type: 'boolean',
        default: true,
        category: 'general',
        description:
          'Use native OS notifications for approval prompts and other alerts that may arrive while Verql is in the background.',
      },
      {
        key: 'onlyWhenUnfocused',
        title: 'Only when Verql isn’t focused',
        type: 'boolean',
        default: true,
        category: 'general',
        description:
          'Skip desktop notifications when a Verql window already has focus — the in-app prompt is right there.',
      },
      {
        key: 'notifyApprovals',
        title: 'Notify when an action needs approval',
        type: 'boolean',
        default: true,
        category: 'general',
        description:
          'Pop a notification when a query authorization or other approval is waiting for your response.',
      },
    ],
  },
}

export function activate(ctx: PluginContext): void {
  const dispatcher = createNotificationDispatcher({
    native: createElectronNativeNotifier(),
    settings: {
      enabled: () => ctx.settings.get<boolean>('enabled') ?? true,
      onlyWhenUnfocused: () => ctx.settings.get<boolean>('onlyWhenUnfocused') ?? true,
      notifyApprovals: () => ctx.settings.get<boolean>('notifyApprovals') ?? true,
    },
  })

  // 1. Publish the high-level service so any plugin can raise a notification:
  //    `ctx.services.consume<OsNotificationService>('os-notifications')?.notify(...)`.
  ctx.services.provide<OsNotificationService>(OS_NOTIFICATIONS_SERVICE_ID, dispatcher)

  // 2. Auto-surface host attention requests (approvals, alerts) as notifications.
  //    `onAvailable` handles boot ordering — it fires immediately if the host
  //    already provided the hub, or later once it does.
  ctx.services.onAvailable<AttentionHub>(ATTENTION_SERVICE_ID, (hub) => {
    ctx.subscriptions.push(hub.subscribe((event) => dispatcher.handleAttention(event)))
  })

  ctx.subscriptions.push({ dispose: () => dispatcher.dispose() })
}
