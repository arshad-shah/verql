---
"verql": patch
"@verql/plugin-sdk": minor
---

Move Postgres EXPLAIN plan parsing out of the renderer into the driver
(DB-boundary fix #1). The renderer previously hardcoded Postgres plan formats
(`(cost=…)` text + `FORMAT JSON` keys). Now:

- `PlanNode` lives in `shared/types`; `DbAdapter` gains an optional
  `parseQueryPlan(result)` (additive to the plugin-author surface).
- The postgresql plugin owns the parsing; a new `db:parse-plan` IPC delegates to
  the active adapter and returns `[]` when a driver has no plan parser.
- The renderer stores the parsed tree on the query tab and renders it
  generically; `lib/plan-parser.ts` is removed. Other drivers can now contribute
  plan parsing by implementing `parseQueryPlan`.
