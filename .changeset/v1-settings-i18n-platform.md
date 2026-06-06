---
"verql": major
---

v1.0.0 — settings fully plumbed, internationalization, and platform hardening.

**Settings (every setting now works end-to-end):**
- Query history backed by the SQLite app-data store (consumes `maxHistoryItems`), surfaced via a Saved/History toggle.
- Restore open tabs on startup (`restoreTabsOnStartup`).
- Data display: custom date pattern, boolean display, and text truncation now apply to results.
- Confirm-on-unsaved-close is honoured; full keybinding rebinding (App-level shortcuts are data-driven; editor already was) with a capture/reset UI.
- Removed orphaned `connectionDefaults` (autoReconnect / defaultSslMode — SSL is driver-owned) and dead `splitRatio`; typed `pluginGrants`.

**Internationalization (new subsystem):**
- Homegrown, dependency-free, cross-process message catalogue (`shared/i18n`) with a typed `t()`/`MessageKey`, ICU-subset interpolation + plurals, a renderer `<I18nProvider>`/`useTranslation`, and a `general.language` setting. All user-facing chrome migrated to it (plugin-authored strings stay plugin-owned). See `docs/i18n.md`.

**Performance, structure & correctness:**
- `App` subscribes to stores per-field (no more whole-shell re-render per keystroke).
- Centralized constants the way IPC channels are: main-process `IPC_EVENTS`, settings category ids, keybinding action ids, and UI panel ids — fixing a broken "Show Schema" command and making settings-open land on the correct category.
