---
"verql": minor
---

Cross-platform, app-integrated title bar. The renderer now owns the title bar on
every OS with a consistent look: macOS keeps its native traffic lights, while
Windows and Linux get app-drawn window controls (minimize / maximize / close)
plus an in-title-bar application menu (File / Edit / View / …) that pops the
native submenus. This fixes the doubled title bar on Windows (native frame +
app bar) and restores the menu that the custom title bar had hidden.

Also fixed in this release:

- **Windows production crash** — `@shared/*` modules were externalised as
  runtime `require()`s (`Cannot find module … shared/settings`) because the
  Vite externalisation guard only recognised POSIX absolute paths. It now uses
  `path.isAbsolute`, so Windows drive-letter paths resolve and the modules are
  bundled.
- **Windows dev console mojibake** — `pnpm dev` now forces the console to UTF-8
  so tooling glyphs (e.g. `✓`) render correctly instead of `Ô£ô`.
