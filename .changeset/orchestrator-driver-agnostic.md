---
"verql": minor
---

The main app is now a pure orchestrator: every line of database-specific logic lives inside its driver plugin. Adding a new database (Cassandra, ClickHouse, DuckDB, anything else) no longer requires editing the main process or the renderer's hot paths.

What changed for the user-facing app:

- Each driver now contributes its own identifier-quote character, prepared-statement placeholder, sample query, and migration DDL builder. The orchestrator routes through these structural capabilities; the previous hardcoded "for these four dialects" table is gone.
- The CSV-into-table importer is fully generic — it asks the active driver for its quoting + placeholder shape, so the same import path works for every relational driver (bundled or third-party).
- SQLite's `INTEGER PRIMARY KEY` rowid quirk during migration moved into the SQLite plugin where it belongs. The migration tool no longer special-cases it.
- The `db:sample-query` IPC handler no longer fabricates a `SELECT * FROM table LIMIT 100` fallback. Every driver, SQL or otherwise, ships its own sample-query implementation.
- Bundled drivers are now wired through a single `src/main/plugins/bundled/index.ts` list. The orchestrator iterates that list — it doesn't reference individual driver names anywhere else.

What changed for plugin authors: see the SDK release notes below — the helpers driver plugins compose (`quoteIdentifier`, `generateCreateTable`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData`) now live in the public SDK barrel and take the driver's quote character as a parameter, so a new driver plugin never has to hardcode a dialect name.

A regression test now scans every file under `src/main/` outside `plugins/` and fails the build if any of `'postgresql'`, `'mysql'`, `'sqlite'`, `'mongodb'`, `'redis'`, `'snowflake'` re-appears in core code.
