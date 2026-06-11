import { describe, it, expect } from 'vitest'
import {
  RELEASE_NOTES,
  getReleaseNote,
  getLatestReleaseNote,
  hasReleaseNote,
} from '../../src/renderer/src/lib/release-notes'

describe('release-notes registry', () => {
  it('has at least one curated release', () => {
    expect(RELEASE_NOTES.length).toBeGreaterThan(0)
  })

  it('every release has unique highlight ids within it', () => {
    for (const note of RELEASE_NOTES) {
      const ids = note.groups.flatMap((g) => g.highlights.map((h) => h.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('every release has a version, headline, and non-empty groups', () => {
    for (const note of RELEASE_NOTES) {
      expect(note.version).toMatch(/\d+\.\d+\.\d+/)
      expect(note.headline.trim().length).toBeGreaterThan(0)
      expect(note.groups.length).toBeGreaterThan(0)
      for (const group of note.groups) {
        expect(group.highlights.length).toBeGreaterThan(0)
      }
    }
  })

  it('getReleaseNote resolves an exact version and misses otherwise', () => {
    const first = RELEASE_NOTES[0]
    expect(getReleaseNote(first.version)).toBe(first)
    expect(getReleaseNote('0.0.0-nonexistent')).toBeUndefined()
  })

  it('hasReleaseNote reflects presence', () => {
    expect(hasReleaseNote(RELEASE_NOTES[0].version)).toBe(true)
    expect(hasReleaseNote('0.0.0-nonexistent')).toBe(false)
  })

  it('getLatestReleaseNote returns the first (newest-first) entry', () => {
    expect(getLatestReleaseNote()).toBe(RELEASE_NOTES[0])
  })
})
