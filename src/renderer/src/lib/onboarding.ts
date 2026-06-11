import { hasReleaseNote } from './release-notes'

/** What, if anything, to open automatically when the app boots. */
export type StartupSurface =
  | { kind: 'welcome' }
  | { kind: 'release-notes'; version: string }
  | null

/**
 * Decide which onboarding surface to auto-open on launch. Pure so it can be
 * unit-tested without the renderer.
 *
 * - **Fresh install** (no version ever recorded) → the Welcome walkthrough,
 *   unless the user has opted out of the startup welcome.
 * - **Version bump** (recorded version differs from the running one) → the
 *   curated "What's New" page, when one is authored for the new version.
 * - Otherwise nothing — we don't nag the Welcome tab on every routine launch.
 *
 * The caller records `currentVersion` as the new `lastSeenVersion` afterwards,
 * so each surface opens at most once per relevant transition.
 */
export function decideStartupSurface(opts: {
  lastSeenVersion: string
  currentVersion: string
  hideWelcomeOnStartup: boolean
}): StartupSurface {
  const { lastSeenVersion, currentVersion, hideWelcomeOnStartup } = opts

  if (!lastSeenVersion) {
    return hideWelcomeOnStartup ? null : { kind: 'welcome' }
  }

  if (lastSeenVersion !== currentVersion && hasReleaseNote(currentVersion)) {
    return { kind: 'release-notes', version: currentVersion }
  }

  return null
}
