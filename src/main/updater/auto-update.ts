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
 * It is wired for the two channels distributed via **GitHub Releases**:
 *   • Linux **AppImage**
 *   • Windows **NSIS** (.exe) — the direct download, NOT the Store build.
 * Every other channel manages its own updates and must never be driven by
 * electron-updater:
 *   • Microsoft Store (MSIX) — the Store updates the app (`process.windowsStore`).
 *   • Snap                   — snapd auto-refreshes installed snaps (`SNAP`).
 *   • macOS                  — Homebrew (handled out-of-band; see launch-check.ts).
 *
 * electron-updater only supports AppImage on Linux (not .deb/.snap) and NSIS on
 * Windows (not appx/MSIX), so this guard keeps it from running where the
 * library can't act anyway.
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
 *  2. Otherwise, only for a packaged install on one of the GitHub-distributed
 *     channels:
 *       • Linux: the **AppImage** — the runtime sets `process.env.APPIMAGE`
 *         to the mounted image path (the canonical "am I an AppImage?"
 *         signal). snapd sets `SNAP` instead, so Snap installs are excluded.
 *       • Windows: the **NSIS** build — distinguished from the Microsoft Store
 *         (MSIX) build by `process.windowsStore`, which Electron sets to true
 *         only when running as a Store app. The Store build also ships no
 *         update feed, so this is belt-and-suspenders.
 *     macOS is intentionally excluded — it updates via Homebrew (launch-check.ts).
 *
 * `process.platform` alone is insufficient: a single Linux build ships as both
 * an AppImage and a Snap, and a single Windows build ships as both NSIS and
 * MSIX; only `APPIMAGE` / `windowsStore` tell the runtimes apart.
 */
export function isElectronUpdaterEnabled(): boolean {
  const override = process.env.APP_UPDATER_ENABLED?.toLowerCase()
  if (override === '1' || override === 'true') return true
  if (override === '0' || override === 'false') return false

  if (!app.isPackaged) return false
  if (process.platform === 'linux') return Boolean(process.env.APPIMAGE)
  if (process.platform === 'win32') return !process.windowsStore
  return false
}

/**
 * Wire `electron-updater` and kick off a check. Safe to call unconditionally
 * on app ready — it no-ops on every channel except the GitHub-distributed
 * AppImage / NSIS builds.
 */
export function initAutoUpdater(): void {
  if (!isElectronUpdaterEnabled()) {
    log('disabled for this install (not a GitHub-distributed AppImage/NSIS build)')
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
