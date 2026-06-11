import { RELEASE_NOTES } from './registry'
import type { ReleaseNote } from './types'

export type { ReleaseNote, ReleaseHighlight, ReleaseHighlightGroup, HighlightTone } from './types'
export { RELEASE_NOTES } from './registry'

/** The curated release note for an exact version, or undefined when none is
 *  authored for it. Version match is exact (it's compared to app.getVersion()). */
export function getReleaseNote(version: string): ReleaseNote | undefined {
  return RELEASE_NOTES.find((r) => r.version === version)
}

/** True when a curated "What's New" page exists for the given version. */
export function hasReleaseNote(version: string): boolean {
  return RELEASE_NOTES.some((r) => r.version === version)
}

/** The most recent curated release note (registry is authored newest-first),
 *  used by Help → "What's New" when no specific version is requested. */
export function getLatestReleaseNote(): ReleaseNote | undefined {
  return RELEASE_NOTES[0]
}
