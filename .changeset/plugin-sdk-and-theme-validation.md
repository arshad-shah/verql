---
"verql": minor
---

The plugin SDK is now a complete, documented surface for third-party plugin authors, and themes are validated end-to-end so a partial theme can never half-paint the app.

**Plugin SDK additions**

- `definePlugin({ manifest, activate, deactivate? })` — typed identity helper that pins the plugin shape at compile time. Missing fields or mistyped contributions fail at compile time instead of at boot.
- SQL helpers exposed in the public barrel: `quoteIdentifier`, `validateIdentifier`, `formatSqlValue`, `generateCreateTable`, `generateInsertStatements`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData`. All take the driver's `quoteChar` as a parameter — no dialect enum.
- Theme helpers exposed: `validateTheme`, `REQUIRED_THEME_TOKENS`, `RECOMMENDED_THEME_TOKENS`. Plugin authors can run the same validator the host runs and fail their own CI before shipping a broken theme.
- Manifest validator now covers `themes`, `exporters`, and `importers` contributions (previously silently accepted any shape and failed later at activation time).

**Theme validation**

- The theme registry validates every theme at registration time and stores the report on the entry. The picker reads it once instead of re-running validation per render.
- Optional `register(theme, { strict: true })` throws on missing required tokens — useful inside a plugin author's CI build.
- The Appearance settings theme grid now **disables** tiles for themes missing required tokens — they're greyed out, non-clickable, and show a tooltip listing the missing tokens. Themes that only miss *recommended* tokens still work and show the existing warning badge.
- `setTheme()` refuses to land on a broken theme even when called programmatically (URL handler, command palette, restored settings), and the resolved-theme fallback skips broken themes when picking the effective theme for the active mode.
- The 9 bundled themes (Lab, Ink & Paper, Dark, Light, Midnight, Dracula, Nord, Solarized, Catppuccin) are pinned by a unit test against the required-token list, so a future palette tweak can't silently break one.

**Documentation**

`docs/plugins.md` has been updated for the new SDK surface: `definePlugin`, the driver capability flags (`quoteChar`, `placeholder`, `sampleQuery`, `generateMigrationDdl`), the theme-token contract, and the bundled-plugins/index.ts wiring file.
