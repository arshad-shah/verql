import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Background auto-updates via `electron-updater` + the GitHub provider.
 *
 * This is distinct from the user-initiated `UpdaterRegistry` (Homebrew, etc.)
 * in `./index.ts`: that one powers the "Check for updates" button in Settings
 * for package-manager installs. This module is the *push* channel — it checks
 * GitHub Releases on launch and downloads/notifies automatically.
 *
 * It is wired for exactly ONE distribution channel: the Linux **AppImage**.
 * Every other channel manages its own updates and must never be driven by
 * electron-updater:
 *   • Microsoft Store (MSIX) — the Store updates the app.
 *   • Snap                   — snapd auto-refreshes installed snaps.
 *   • macOS                  — Homebrew (handled out-of-band).
 *
 * electron-updater itself only supports AppImage on Linux (not .deb, not
 * .snap), so this guard also keeps it from running where the library can't act.
 */

const LOG_PREFIX = '[auto-updater]'

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args)
}

/**
 * Decide whether the background updater should run for this install.
 *
 * Detection — in priority order:
 *  1. `APP_UPDATER_ENABLED` env var as an explicit override (`'1'`/`'true'`
 *     forces on, `'0'`/`'false'` forces off). Lets CI smoke-tests and power
 *     users opt in/out without rebuilding.
 *  2. Otherwise: enabled only for a packaged Linux AppImage. The AppImage
 *     runtime sets `process.env.APPIMAGE` to the path of the mounted image —
 *     this is the canonical, reliable "am I an AppImage?" signal. snapd sets
 *     `SNAP` instead (so snaps are excluded), and the MSIX/Store build runs on
 *     Windows where `APPIMAGE` is never set. `app.isPackaged` keeps it off in
 *     `pnpm dev`.
 *
 * Chosen over `process.platform` alone because a single Linux build can be
 * shipped as both an AppImage *and* a Snap; only the `APPIMAGE` env var tells
 * the two runtimes apart.
 */
export function isAppImageUpdaterEnabled(): boolean {
  const override = process.env.APP_UPDATER_ENABLED?.toLowerCase()
  if (override === '1' || override === 'true') return true
  if (override === '0' || override === 'false') return false

  return app.isPackaged && process.platform === 'linux' && Boolean(process.env.APPIMAGE)
}

/**
 * Wire `electron-updater` and kick off a check. Safe to call unconditionally
 * on app ready — it no-ops on every channel except the AppImage.
 */
export function initAutoUpdater(): void {
  if (!isAppImageUpdaterEnabled()) {
    log('disabled for this install (not a packaged Linux AppImage)')
    return
  }

  // Route electron-updater's own diagnostics through our prefixed logger so
  // download progress + errors land in the same stream as the events below.
  autoUpdater.logger = {
    info: (m: unknown) => log('info', m),
    warn: (m: unknown) => log('warn', m),
    error: (m: unknown) => log('error', m),
    debug: (m: unknown) => log('debug', m),
  }

  autoUpdater.on('checking-for-update', () => log('checking for update…'))
  autoUpdater.on('update-available', (info) => log('update available', info.version))
  autoUpdater.on('update-not-available', () => log('already up to date'))
  autoUpdater.on('download-progress', (p) =>
    log(`downloading ${Math.round(p.percent)}% (${Math.round(p.bytesPerSecond / 1024)} KB/s)`),
  )
  autoUpdater.on('update-downloaded', (info) =>
    log('update downloaded; will install on quit', info.version),
  )
  autoUpdater.on('error', (err) => log('error', err))

  // Downloads the update in the background and shows a native notification when
  // it's ready; the new version is applied on the next quit/relaunch.
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log('checkForUpdatesAndNotify failed', err)
  })
}
