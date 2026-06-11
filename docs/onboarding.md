# Onboarding & release notes

Two VS Code-style editor tabs welcome new users and surface what changed on an
update:

- **Welcome** — a first-run "Get Started" walkthrough: a brand hero, quick
  actions, an interactive setup checklist, and resource links.
- **What's New** — a per-version, hand-authored release-notes page (the tab is
  titled after the version, e.g. `v1.2.0`).

Both are ordinary tabs (singletons), so they're re-openable any time from
**Help**, the command palette, or AI app-actions — they're not modal nags.

> **Where the logic lives.** Onboarding is glue + content in the renderer; there
> is no new main-process subsystem. The only main-process touch points are the
> existing `app:about-info` channel (to read the running version) and the
> generic `settings:set` pipeline (to persist what the user has seen).

## Pieces

| Piece | File | Role |
|-------|------|------|
| Tab types | `shared/types.ts` | `WelcomeTab`, `ReleaseNotesTab` added to the `Tab` union |
| Persisted state | `shared/settings.ts` | `OnboardingSettings` (`lastSeenVersion`, `completedSteps`, `hideOnStartup`) under `settings.onboarding` |
| Tab actions | `src/renderer/src/stores/tabs.ts` | `openWelcome()`, `openReleaseNotes(version)` (singleton tabs) |
| Startup decision | `src/renderer/src/lib/onboarding.ts` | `decideStartupSurface(...)` — pure; chooses welcome / release-notes / nothing |
| Release registry | `src/renderer/src/lib/release-notes/` | `types.ts`, hand-authored `registry.ts`, and `index.ts` helpers (`getReleaseNote`, `hasReleaseNote`, `getLatestReleaseNote`) |
| Welcome UI | `src/renderer/src/components/welcome/` | `WelcomeView` (wires stores) + `GetStartedStep` (presentational, storyable) |
| Release UI | `src/renderer/src/components/release-notes/` | `ReleaseNotesView` (resolves version → note) + `ReleaseNotesContent` (presentational, storyable) |
| Dispatch | `components/shell/ActiveTabView.tsx`, `tab-bar/tab-icons.ts` | renders the tab body + the tab-bar icon for each new type |
| Entry points | `menu-model.tsx` (Help), `command-palette`, `lib/app-actions/builtins.ts` | open Welcome / What's New from menu, palette, and AI |
| Boot wiring | `src/renderer/src/main.tsx` | calls `decideStartupSurface` after hydrate + tab restore, then records `lastSeenVersion` |

## Startup behaviour

On boot (after settings hydrate and tab restore), `main.tsx` reads the running
version and the persisted `onboarding` state and calls `decideStartupSurface`:

- **Fresh install** (`lastSeenVersion === ''`) → open **Welcome** (unless
  `hideOnStartup`).
- **Version bump** (`lastSeenVersion !== currentVersion`) → open **What's New**
  for the new version, *if* a curated note exists for it.
- Otherwise → nothing (routine launches don't re-pop the Welcome tab).

It then records `currentVersion` as the new `lastSeenVersion`, so each surface
opens **at most once** per transition. The decision function is pure and
unit-tested in `tests/unit/onboarding.test.ts`.

### The Get Started checklist

`WelcomeView` renders a checklist of `GetStartedStep`s. A step is "done" when it
is **auto-detected** from app state *or* **manually marked** (its id in
`onboarding.completedSteps`). Running a step's action also marks it done, so the
progress count reflects what the user has actually done.

Auto-detection is best-effort and only used where the renderer can observe it
(e.g. a connection exists, query history is non-empty, an AI model is selected).
AI **keys are redacted out of the renderer**, so the AI step can't be detected
from the key itself — it falls back to the selected-model heuristic + manual
marking.

## Authoring release notes (for humans and AI agents)

Release notes are **hand-authored content**, deliberately *not* generated from
`CHANGELOG.md`: the changelog is developer-facing (PRs, commit hashes, dialect
detail) while these pages speak to end users in plain language with a polished,
component-built layout. Authoring one is a small, structured task.

**To add a "What's New" page for a release, edit only
`src/renderer/src/lib/release-notes/registry.ts`:**

1. Add a new `ReleaseNote` object to the **top** of the `RELEASE_NOTES` array
   (the array is newest-first; `getLatestReleaseNote()` returns `[0]`).
2. Set `version` to **exactly** match `package.json`'s `version` — the running
   app resolves the page by exact string match, so a mismatch means no page
   opens on update.
3. Fill the fields (shape defined in `./types.ts`):

   ```ts
   {
     version: '1.2.0',          // exact semver, == package.json
     date: '2026-06-01',        // ISO YYYY-MM-DD; rendered locale-formatted
     headline: 'One line...',   // marketing headline for the hero
     summary: 'A short paragraph (1–3 sentences) framing the release.',
     groups: [
       {
         title: 'New features', // section heading
         tone: 'feature',       // 'feature' | 'improvement' | 'fix'
         highlights: [
           {
             id: 'unique-slug',  // unique within this release (React key)
             icon: Sparkles,     // any lucide-react icon (import it at top)
             title: 'Short headline, sentence case, no trailing period',
             description: 'One or two plain-language sentences. Speak to the user, not the codebase.',
           },
         ],
       },
     ],
     links: [                   // optional footer resource links
       { label: 'Full changelog', url: 'https://github.com/arshad-shah/verql/blob/main/CHANGELOG.md' },
     ],
   }
   ```

**Authoring rules**

- Order groups **feature → improvement → fix**; `tone` drives the section badge
  and accent (`New` / `Improved` / `Fixed`).
- Keep highlight `title`s short and sentence-case with **no trailing period**;
  put the detail in `description`.
- Write for **end users**: say what they can now do, not which file changed.
  Stay **DB-agnostic** (don't assume SQL — see CLAUDE.md) unless a highlight is
  genuinely driver-specific.
- `icon` is any `lucide-react` component — add it to the import block at the top
  of `registry.ts`.
- Highlight `id`s must be unique within a release (enforced by
  `tests/unit/release-notes.test.ts`).

**This is content, not UI chrome**, so the authored strings live in the registry
in English rather than the `shared/i18n` catalogue. The surrounding chrome (tab
title, section labels, badges, "What's New" entry points) *is* localized through
`shared/i18n`.

After adding a note, `tests/unit/release-notes.test.ts` validates the structural
invariants (unique ids, non-empty groups, version shape).

## Surfaces & entry points

| Surface | How |
|---------|-----|
| **Help menu** | `menu-model.tsx` → *Welcome* and *What's New* (the latter hidden when no curated note exists) |
| **Command palette** | `command-palette` → *Help: Welcome*, *Help: What's New* |
| **AI app-actions** | `lib/app-actions/builtins.ts` → `open-welcome`, `open-release-notes` (optional `version` param) |
| **Welcome → What's New** | the Welcome tab links to the latest release page |

## Testing

- `tests/unit/onboarding.test.ts` — the pure startup decision across fresh
  install / version bump / opt-out / no-note / unchanged.
- `tests/unit/release-notes.test.ts` — registry helpers + structural invariants.
- Stories: `GetStartedStep.stories.tsx`, `ReleaseNotesContent.stories.tsx`
  (both presentational, prop-driven).
