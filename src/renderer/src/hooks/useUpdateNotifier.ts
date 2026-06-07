import { useEffect } from 'react'
import { IPC_EVENTS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'
import { useToastStore } from '@/stores/toast'
import { useNotificationsStore } from '@/stores/notifications'
import { useUpdaterStore, type PendingUpdate } from '@/stores/updater'

/**
 * App-level subscriber for the one-shot `updater:available` broadcast that the
 * main process sends when the launch check finds a newer version (currently the
 * Homebrew channel). Fans it out to three in-app surfaces — a persistent toast,
 * a notification-centre entry, and the Settings → Updates banner (via
 * `useUpdaterStore`). The native OS notification is raised in main through the
 * attention seam, so it isn't repeated here.
 *
 * Mounted once at the App root; the always-mounted store means the banner shows
 * even if Settings is opened after the event arrives.
 */
export function useUpdateNotifier(): void {
  const { t } = useTranslation()

  useEffect(() => {
    return window.electronAPI.on(IPC_EVENTS.UPDATER_AVAILABLE, (...args: unknown[]) => {
      const payload = args[0] as PendingUpdate | undefined
      if (!payload?.latestVersion) return

      const title = t('settings.updates.available')
      const message = t('settings.updates.availableMessage', {
        version: payload.latestVersion,
        manager: payload.displayName,
      })

      useUpdaterStore.getState().setPending(payload)
      // Stable id so a re-broadcast replaces rather than stacks the toast.
      useToastStore.getState().addToast({ id: 'app-update', type: 'info', title, message, persistent: true })
      useNotificationsStore.getState().addNotification({ type: 'info', title, message })
    })
  }, [t])
}
