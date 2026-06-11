import { describe, it, expect } from 'vitest'
import { decideStartupSurface } from '../../src/renderer/src/lib/onboarding'
import { RELEASE_NOTES } from '../../src/renderer/src/lib/release-notes'

const versionWithNote = RELEASE_NOTES[0].version

describe('decideStartupSurface', () => {
  it('opens the welcome walkthrough on a fresh install', () => {
    expect(
      decideStartupSurface({ lastSeenVersion: '', currentVersion: '9.9.9', hideWelcomeOnStartup: false }),
    ).toEqual({ kind: 'welcome' })
  })

  it('suppresses the fresh-install welcome when opted out', () => {
    expect(
      decideStartupSurface({ lastSeenVersion: '', currentVersion: '9.9.9', hideWelcomeOnStartup: true }),
    ).toBeNull()
  })

  it('opens release notes after a version bump when notes exist', () => {
    expect(
      decideStartupSurface({
        lastSeenVersion: '0.0.1',
        currentVersion: versionWithNote,
        hideWelcomeOnStartup: false,
      }),
    ).toEqual({ kind: 'release-notes', version: versionWithNote })
  })

  it('shows release notes even when the welcome is opted out', () => {
    expect(
      decideStartupSurface({
        lastSeenVersion: '0.0.1',
        currentVersion: versionWithNote,
        hideWelcomeOnStartup: true,
      }),
    ).toEqual({ kind: 'release-notes', version: versionWithNote })
  })

  it('does nothing after a bump to a version without notes', () => {
    expect(
      decideStartupSurface({
        lastSeenVersion: '0.0.1',
        currentVersion: '9.9.9-no-notes',
        hideWelcomeOnStartup: false,
      }),
    ).toBeNull()
  })

  it('does nothing on an unchanged version', () => {
    expect(
      decideStartupSurface({
        lastSeenVersion: versionWithNote,
        currentVersion: versionWithNote,
        hideWelcomeOnStartup: false,
      }),
    ).toBeNull()
  })
})
