---
"verql": patch
"@verql/plugin-sdk": minor
---

Move query-semantic error classification into the drivers (DB-boundary fix #2).
The renderer previously hardcoded PG/MySQL/SQLite error-message patterns in
`lib/db-error.ts`. Now:

- `DbErrorCode` + a serializable `DbErrorRule` live in `shared/db-errors`; an
  `errorRules` capability is added to the `@verql/plugin-sdk` `DriverFactory`
  (additive) and serialized into driver capabilities.
- The postgresql/mysql/sqlite plugins declare their dialect's rules (bad
  column/table/schema, syntax, constraints, type mismatch, duplicate table,
  division-by-zero, deadlock, aborted txn).
- `parseDbError(raw, dbType?)` applies the active driver's rules first (regex from
  the driver, friendly message from the renderer's i18n catalogue), then host
  rules for connection/auth/app-layer errors that span drivers. A new driver can
  contribute its own error classification by shipping `errorRules` — no host
  changes. Classification behaviour is unchanged (42-case characterization test).
