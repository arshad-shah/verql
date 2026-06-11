import type { LucideIcon } from 'lucide-react'
import type { MessageKey } from '@shared/i18n'

/** Which bucket a highlight belongs to. Drives the accent + default grouping
 *  order in the release-notes view (features first, then improvements, fixes). */
export type HighlightTone = 'feature' | 'improvement' | 'fix'

// All user-facing prose is an i18n `MessageKey`, resolved through `t()` in the
// view — the registry never inlines copy. The strings live in
// `shared/i18n/locales/en/whats-new.ts`.

/** A single, self-contained thing that changed in a release — the unit users
 *  actually read. Structure lives in the registry; copy lives in i18n. */
export interface ReleaseHighlight {
  /** Stable id, unique within its release. Used as the React key. */
  id: string
  /** Lucide icon rendered in the highlight's chip. */
  icon: LucideIcon
  /** i18n key for the short headline (a few words, sentence case). */
  title: MessageKey
  /** i18n key for the one/two-sentence description. */
  description: MessageKey
  /** Bucket. Defaults to the group's implied tone when omitted. */
  tone?: HighlightTone
}

/** A titled section of highlights ("New features", "Fixes", …). */
export interface ReleaseHighlightGroup {
  /** i18n key for the section heading. */
  title: MessageKey
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
  /** i18n key for the one-line hero headline. */
  headline: MessageKey
  /** i18n key for the short summary paragraph (1–3 sentences). */
  summary: MessageKey
  /** The body, grouped into sections. */
  groups: ReleaseHighlightGroup[]
  /** Optional resource links (full changelog, docs) shown in the footer; the
   *  label is an i18n key, the url is a literal. */
  links?: { label: MessageKey; url: string }[]
}
