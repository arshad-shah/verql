---
"verql": minor
---

Driver-declared EXPLAIN, data-grid browse, and database-explorer fixes

- **EXPLAIN is now driver-declared.** Each driver's `explain` capability carries
  the statement to run (Postgres/MySQL `EXPLAIN ANALYZE`, SQLite
  `EXPLAIN QUERY PLAN`, Snowflake `EXPLAIN`); the app no longer hardcodes a
  dialect, and the Explain action is hidden for drivers that can't explain
  (Redis, MongoDB) — fixing the `ERR unknown command 'EXPLAIN'` on Redis.
- **Data-grid browse** for non-SQL stores: a new "View data" action opens a
  key/type/value (Redis) or document (Mongo) grid via the driver's own
  `getTableData` reader, shown for any driver that declares `hasGetTableData`.
- **MySQL explorer** no longer shows server-internal databases and no longer
  mis-nests schemas (MySQL databases are treated as their own schema).
- **GradientSurface** primitive (accent/neutral × subtle/bold) — used by the
  About modal's hero.
- Redis browsing now lists a key prefix's keys instead of erroring; the explorer
  shows "No columns" for schema-less stores instead of a stuck "Loading…".
