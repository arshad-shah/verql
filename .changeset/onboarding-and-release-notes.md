---
"verql": minor
---

Add first-run onboarding and per-version release notes, VS Code-style.

- **Welcome tab** — a "Get Started" walkthrough that opens on a fresh install:
  a brand hero, quick actions (new connection / query / plugins), an interactive
  setup checklist whose steps auto-complete from app state, and learn/resource
  links. Re-openable any time from Help → Welcome, the command palette, or AI.
- **What's New tab** — a hand-authored, per-version release-notes page (titled
  after the version) that opens automatically after an update when a curated
  entry exists, and from Help → What's New. Content lives in a typed registry
  (`lib/release-notes/`) with authoring instructions in `docs/onboarding.md`.
- New `settings.onboarding` state (`lastSeenVersion`, `completedSteps`,
  `hideOnStartup`) drives a pure, unit-tested startup decision; the Welcome and
  release surfaces are also exposed as `open-welcome` / `open-release-notes`
  app-actions.
