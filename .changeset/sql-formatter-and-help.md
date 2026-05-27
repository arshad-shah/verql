---
"verql": minor
---

SQL formatting, in-app help, and docs:

- **Format query** — the editor can now pretty-print the buffer ("Format Document" / Shift+Alt+F, or ask the assistant to "format this"). Formatting is plugin-owned and keyed by editor language: SQL drivers (PostgreSQL, MySQL, SQLite, Snowflake) contribute dialect formatters backed by `sql-formatter`, MongoDB pretty-prints its JSON, and Redis tidies its command buffer. New database plugins can contribute a formatter for their own query language via the new `formatters` contribution surface.
- **Help menu** — a native Help menu links to the documentation and issue tracker, and the About panel shows the version (macOS/Linux).
- **Docs** — added `docs/architecture.md` and `docs/ai.md`, documented the formatter surface in `docs/plugins.md`, and refreshed `CLAUDE.md` with a docs-first workflow and the glue↔plugin ownership boundary.
