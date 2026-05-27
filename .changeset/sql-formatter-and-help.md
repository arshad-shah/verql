---
"verql": minor
---

SQL formatting, in-app help, and docs:

- **Format SQL** — the query editor can now pretty-print SQL ("Format Document" / Shift+Alt+F, or ask the assistant to "format my SQL"). Formatting is plugin-owned: each database driver contributes a dialect formatter (PostgreSQL, MySQL, SQLite, Snowflake), with a generic fallback, all backed by `sql-formatter`. New database plugins can contribute their own via the new `formatters` contribution surface.
- **Help menu** — a native Help menu links to the documentation and issue tracker, and the About panel shows the version (macOS/Linux).
- **Docs** — added `docs/architecture.md` and `docs/ai.md`, documented the formatter surface in `docs/plugins.md`, and refreshed `CLAUDE.md` with a docs-first workflow and the glue↔plugin ownership boundary.
