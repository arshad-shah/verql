---
"verql": minor
---

Begin the incremental Cynosure migration: stand up the foundation alongside
Tailwind (both coexist) and migrate the first surface — the Appearance theme
controls.

- **Foundation.** Add `@arshad-shah/cynosure-react`, import its component CSS
  then `styles/cynosure-bridge.css` (aliases every `--cynosure-*` semantic token
  onto the active Verql theme's `--color-*` tokens, so any theme — bundled or
  plugin — restyles Cynosure with zero per-theme work; coverage pinned by
  `tests/unit/cynosure-bridge.test.ts`). Mount `CynosureAppProvider` inside
  Verql's `ThemeProvider`. Tailwind stays wired; components migrate one at a
  time and Tailwind is removed only once nothing uses it.
- **Theme controls.** The Appearance color-mode selector is now Cynosure's
  `<ThemeToggle>` (segmented light/dark/system), right-aligned in a `SettingRow`
  like the other controls, and the theme-picker cards are rebuilt from Cynosure
  primitives (`ThemeControls.tsx`). Verql's `appearance.appearanceMode` stays the
  single persisted source of truth; `CynosureModeBridge` two-way mirrors it with
  Cynosure's theme context, and Cynosure publishes the resolved `light`/`dark`
  on `data-cynosure-scheme` for scrollbars, charts, and CodeBlock highlighting.

No change to the rest of the Appearance settings, which stay on the existing
primitives until their own migration pass.
