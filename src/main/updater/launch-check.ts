import { t } from '@shared/i18n'
import { IPC_EVENTS } from '@shared/ipc'
import { broadcast } from '../ipc/broadcast'
import type { UpdaterRegistry } from './registry'
import type { AttentionHub } from '../attention/attention-hub'

/**
 * One-shot, fire-and-forget update check on launch for the **registry-managed**
 * channels (currently Homebrew on macOS) — the channels that update via an
 * external package manager rather than electron-updater.
 *
 * It checks exactly once at startup and then stops; it never polls. When a
 * newer version exists it fans out to four surfaces:
 *   • OS notification  — published to the host attention seam, which the
 *     bundled `os-notifications` plugin turns into a native notification (only
 *     when the app is unfocused, per that plugin's policy).
 *   • Toast + notification centre + the Settings → Updates banner — all driven
 *     by a single `updater:available` broadcast (see the renderer's
 *     `useUpdateNotifier` hook).
 *
 * The electron-updater channels (AppImage / NSIS) are handled separately in
 * `auto-update.ts`; on those platforms the registry has no active updater, so
 * this check no-ops.
 */
export async function runLaunchUpdateCheck(
  registry: UpdaterRegistry,
  attention: AttentionHub,
): Promise<void> {
  try {
    const active = await registry.detectActive()
    if (!active) return

    const info = await active.checkForUpdate()
    if (!info.available || !info.latestVersion) return

    const title = t('settings.updates.available')
    const body = t('settings.updates.availableMessage', {
      version: info.latestVersion,
      manager: active.displayName,
    })

    // OS notification via the delivery-agnostic attention seam.
    attention.request({ id: 'app-update-available', kind: 'info', title, body, source: 'updater' })

    // In-app surfaces (toast, notification centre, settings banner).
    broadcast(IPC_EVENTS.UPDATER_AVAILABLE, {
      displayName: active.displayName,
      currentVersion: info.currentVersion,
      latestVersion: info.latestVersion,
    })
  } catch {
    // A failed or slow check must never affect launch.
  }
}
