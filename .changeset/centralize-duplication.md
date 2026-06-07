---
"verql": patch
---

Reduce duplicated code by centralizing shared helpers and hooks.

- `formatCompactNumber` (lib/format.ts) replaces three identical row/token
  number formatters; `formatRelativeTime` / `formatClockTime` (lib/format-time.ts)
  replace the per-file time formatters (and give NotificationItem the i18n it
  was missing).
- One `useClipboard()` hook replaces the two narrow copy hooks and an inline
  copy variant: it exposes a transient `copied` flag and an optional success
  toast via `copy(text, { toast })`, covering every copy surface (code blocks,
  chat messages, notifications, and the explorer's context menus / hover
  actions).

CONTRIBUTING.md and CLAUDE.md now document this "centralize, don't duplicate"
requirement.
