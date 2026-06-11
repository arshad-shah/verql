---
"verql": minor
---

Make destructive-statement detection driver-aware.

The "this can change data — run anyway?" confirm no longer assumes SQL for every
connection. Detection now routes through the statement contribution selected by
the driver's `statementSyntax` capability (the same mechanism the Run/Explain
gutter uses), so each driver gets the right semantics:

- **SQL** — `DELETE`/`DROP`/`TRUNCATE` and an `UPDATE` with no `WHERE`.
- **Redis** — `FLUSHALL`/`FLUSHDB`/`DEL`/`UNLINK`/`GETDEL`.
- **MongoDB** — `drop`/`dropDatabase`/`deleteMany`/`deleteOne`/`remove`/`findOneAndDelete`.
- **Any other syntax** — no spurious SQL-keyword warning unless that syntax
  contributes its own `classifyDestructive`.

A new generic confirm message backs the non-SQL cases. The SQL classifier still
reuses the pure, unit-tested `destructiveKind` helper.
