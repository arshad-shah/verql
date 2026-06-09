---
"verql": minor
---

Begin the migration of the design system to `@arshad-shah/cynosure-react` —
Stage 1: foundation and theming.

The renderer now loads Cynosure's component styles plus a token **bridge**
(`styles/cynosure-bridge.css`) that aliases every semantic `--cynosure-*`
token to the corresponding Verql `--color-*` theme token. Because Verql themes
(baseline Nightshift, the core-themes plugin, and third-party theme plugins)
all define those tokens under `[data-theme="<id>"]`, every existing and future
theme restyles Cynosure components automatically — no per-theme Cynosure work.
Coverage is enforced by a unit test that fails if a Cynosure upgrade
introduces a semantic token the bridge doesn't map.

`CynosureAppProvider` (mounted in `main.tsx` inside Verql's ThemeProvider)
composes Cynosure's theme/direction/locale/tooltip contexts, and
`CynosureSchemeSync` publishes the active theme's light/dark *type* — taken
from the theme registry, never name heuristics — to a dedicated
`data-cynosure-scheme` attribute and the root `color-scheme`, fixing native
control/scrollbar polarity for plugin themes that the previous hardcoded CSS
list couldn't know about.

Subsequent stages replace Verql primitives with their Cynosure counterparts
section by section (tracked in `docs/cynosure-migration.md`).
