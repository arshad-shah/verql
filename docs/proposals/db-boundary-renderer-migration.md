# DB-boundary: move renderer db-specific logic into driver plugins

> Status: **planned** (audit complete; main process verified clean). Tracks the
> remaining work to honour the ownership boundary (CLAUDE.md → "Ownership
> boundary"): the host provides generic glue + interfaces; **drivers own
> db-specific logic**.

## Verified clean (do not touch)

The **main process is already generic** — every db path resolves through the
adapter/registry/capability interface with no db-type branching:

- `src/main/db/factory.ts` — `createAdapter` resolves purely via the driver
  registry; no special-cases.
- `src/main/db/adapter.ts` — pure interface; engine-specific methods optional.
- `src/main/ipc/db.ts` — delegates to the adapter/registry; `db:sample-query`
  throws rather than fabricating SQL; capabilities are serialized from the driver.
- `src/main/migration/type-map.ts`, renderer `pick-default-schema.ts`,
  `initial-autocommit.ts`, `monaco-sql.ts`, `QueryEditor` (language from
  capabilities), `statement-registry.ts` (generic keyed registry).

The remaining db-specific code is in **three renderer files**. Each is a
cross-process change with a design decision; sequenced below.

## #1 — `lib/plan-parser.ts` (Postgres EXPLAIN parsing) — HIGH

**Problem.** `parsePlanText` (PG `(cost=… rows=…)` text) and `convertPgJsonPlan`
(PG JSON keys) encode Postgres plan knowledge in the renderer. Consumers:
`QueryPlanView.tsx` (renders) and `BottomDock.tsx` (derives `hasPlan` for tab
visibility) — **both synchronous** over `results.rows`.

**Design.**
1. `PlanNode` type → `shared/` (cross-process).
2. Add `parseQueryPlan?(result: QueryResult): PlanNode[]` to `DbAdapter`; move the
   PG logic into the `postgresql` plugin. Other drivers omit it (→ no plan tab).
3. IPC `db:parse-plan(connectionId, result) → PlanNode[]`, delegating to the
   adapter.
4. Renderer: parse once when results are set for a tab and store
   `queryPlan?: PlanNode[]` on `QueryTab`; `BottomDock.hasPlan` and
   `QueryPlanView` read the stored field (keeps them synchronous).
   - **Decision:** parse on every result-set (one extra IPC per query) vs. only
     when the user opens the plan tab. Recommend the former (simple, bounded).
5. Delete `lib/plan-parser.ts`; extend `export-import-no-hardcoding` guard to
   assert no `Node Type`/`cost=` literals in the renderer.

## #2 — `lib/db-error.ts` (PG/MySQL/SQLite error patterns) — HIGH

**Problem.** The `PATTERNS` table hardcodes driver-specific error text. New
drivers get no classification and can't contribute patterns. (The IPC/AI/network
codes + `unwrap()` are legitimately generic — keep them.)

**Design.**
1. Define a serializable error-rule shape: `{ code, pattern: string /* regex src */,
   flags?, captures?: string[] }`. Keep the `DbErrorCode` enum + messages in the
   renderer catalogue (already i18n'd as `errors.*`).
2. New driver surface: `errorRules?: DbErrorRule[]` on the driver factory; serialize
   via capabilities (or a dedicated `db:error-rules` IPC). Move PG/MySQL/SQLite
   rules into their plugins.
3. Renderer: build the matcher from the active connection's driver rules +
   generic fallback (timeouts, network, keyring, AI). `parseDbError` becomes
   connection-aware (it currently takes only the raw string).
   - **Decision:** regexes cross IPC as source strings (rebuilt with `new RegExp`).
     Validate/escape at registration.

## #3 — `lib/statement-contributions/{sql,redis,mongodb,index}.ts` — ✅ DONE (Option A)

Shipped: added a `statementSyntax` driver capability (`DriverFactory` +
`DriverCapabilities` + `serializeStaticCapabilities`); bundled drivers declare it
(`sql`/`redis`/`mongodb`); the statement registry is keyed by syntax id and
`registerBuiltinStatementContributions` no longer enumerates db types;
`StatementGutter` resolves the syntax from the driver capability. Original
analysis retained below.

---

**Problem.** Per-dialect statement splitters live in the renderer and
`index.ts` wires them with a hardcoded db-type list
(`['postgresql','mysql','sqlite','snowflake']` + redis + mongodb).
`editorLanguage` is a Monaco highlight id (mongo=`json`, redis=`plaintext`) so it
is **not** a valid splitter discriminator.

**Ownership decision (required first).** The splitter is pure (string → ranges)
but is invoked **per keystroke** by `StatementGutter` for CodeLens.
- Option A (recommended): add a driver capability `statementSyntax: 'sql' |
  'redis' | 'mongodb' | null`. Drivers declare it; the renderer keys its
  (generic, Monaco-coupled) splitters by that id and resolves it from the caps
  store. Removes the hardcoded enumeration; driver owns the *declaration*. Splitter
  code stays renderer-side (no per-keystroke IPC). Lens actions stay renderer UI.
- Option B (purist): driver provides the splitter via `db:split-statements` IPC.
  Rejected for v1 — IPC per keystroke is a perf regression.

**Design (Option A).**
1. `statementSyntax` on `DriverCapabilities` (+ `serializeStaticCapabilities`).
2. Each bundled driver declares it (sql family → `'sql'`, redis → `'redis'`,
   mongodb → `'mongodb'`).
3. `statement-registry` keyed by syntax id; `registerBuiltinStatementContributions`
   registers under `'sql'`/`'redis'`/`'mongodb'` with no db-type loop.
4. `StatementGutter` resolves `statementSyntax` from the caps store instead of
   taking `dbType`.

## Sequencing

Do #1 → #3 → #2 (ascending IPC/serialization complexity). Each ships as its own
commit + changeset, with the no-hardcoding guard test extended to lock it in.
