---
"verql": patch
"@verql/plugin-sdk": minor
---

Move statement-gutter dialect selection behind a driver capability (DB-boundary
fix #3). Drivers now declare a `statementSyntax` (`'sql'` / `'redis'` /
`'mongodb'`) on their factory; the renderer's statement registry is keyed by that
syntax and `StatementGutter` resolves it from the driver's capabilities, instead
of a hardcoded db-type list in the renderer. A new SQL driver gets the
"Run/Explain" gutter for free by declaring `statementSyntax: 'sql'`. Adds the
optional `statementSyntax` field to the `@verql/plugin-sdk` `DriverFactory` type
(additive). Behaviour for the bundled drivers is unchanged.
