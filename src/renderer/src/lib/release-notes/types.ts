import type { LucideIcon } from 'lucide-react'

/** Which bucket a highlight belongs to. Drives the accent + default grouping
 *  order in the release-notes view (features first, then improvements, fixes). */
export type HighlightTone = 'feature' | 'improvement' | 'fix'

/** A single, self-contained thing that changed in a release — the unit users
 *  actually read. Authored by hand in the registry (see registry.ts). */
export interface ReleaseHighlight {
  /** Stable id, unique within its release. Used as the React key. */
  id: string
  /** Lucide icon rendered in the highlight's chip. */
  icon: LucideIcon
  /** Short headline — a few words, sentence case, no trailing period. */
  title: string
  /** One or two plain-language sentences. Speak to the user, not the codebase. */
  description: string
  /** Bucket. Defaults to the group's implied tone when omitted. */
  tone?: HighlightTone
}

/** A titled section of highlights ("New features", "Fixes", …). */
export interface ReleaseHighlightGroup {
  /** Section heading. */
  title: string
  /** The tone applied to highlights in this group that don't set their own. */
  tone: HighlightTone
  highlights: ReleaseHighlight[]
}

/** A curated release entry. One per shipped version we want users to see a
 *  "What's New" page for. The renderer resolves the running app version to one
 *  of these; versions without an entry simply don't pop a release tab. */
export interface ReleaseNote {
  /** Plain semver string, matching `app.getVersion()` exactly (e.g. "1.2.0"). */
  version: string
  /** Release date as an ISO `YYYY-MM-DD` string; rendered locale-formatted. */
  date: string
  /** One-line marketing headline for the hero. */
  headline: string
  /** A short paragraph (1–3 sentences) framing the release. */
  summary: string
  /** The body, grouped into sections. */
  groups: ReleaseHighlightGroup[]
  /** Optional resource links (full changelog, docs) shown in the footer. */
  links?: { label: string; url: string }[]
}
