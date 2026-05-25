# Driver Session & Transaction Capabilities — Design

**Date:** 2026-05-25
**Status:** Approved (design)
**Branch:** `worktree-driver-session-capabilities` (off `main`)

## Problem

Verql lacks the connection/driver-layer UX that mature clients (DataGrip, DBeaver)
provide: auto-commit toggle, manual commit/rollback, transaction isolation,
read-only mode, EXPLAIN/execution plans, and active-session (process) management.

`DbAdapter` today is `connect / query / disconnect / schema introspection /
switch{Database,Schema,Warehouse,Role} / cancelQuery?`. There is **no** transaction
or session lifecycle of any kind.

These features must arrive as a **declarative capability surface**: each driver
*declares* what it supports and *owns* all dialect-specific SQL, while the main
process and renderer stay engine-agnostic. This mirrors the existing
`DriverFactory` → `DriverCapabilities` pattern, where the renderer reads capability
flags and **never branches on db type** (a documented invariant across the codebase).

### Why a naive approach fails

"Transaction" means radically different things per engine:

- ACID `BEGIN/COMMIT/ROLLBACK` — PostgreSQL, MySQL, SQLite, Snowflake
- Replica-set sessions (conditional on topology) — MongoDB
- `MULTI/EXEC` with `DISCARD` instead of rollback — Redis

Bolting `beginTransaction()/commit()/rollback()` onto `DbAdapter` would be
SQL-centric and leak the wrong model into the core. Instead, drivers declare
*which* transaction semantics they support and how to *label* them.

### The pooled-connection constraint

PostgreSQL and MySQL adapters run every query against a pool (`pg.Pool({ max: 5 })`).
Manual transactions require a **pinned single connection** — you cannot `BEGIN` on
one pooled client and `COMMIT` on another. So "auto-commit off" is not just a flag;
it forces lazy session-pinning in those adapters.

## Scope

**In scope:** capability framework + IPC + serialization; per-tab session/transaction
runtime (auto-commit toggle, manual commit/rollback, isolation, read-only); EXPLAIN
(lean plan tree / text); active-session inspection + kill; per-driver capability
declarations for all six bundled drivers.

**Out of scope (separate future spec):** large-result streaming / server-side
cursors. This touches the AG-Grid data path, not the session model, and is
independent.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Transaction state scope | **Per-tab/console** (DataGrip-style); lazily pins a dedicated connection |
| Capability mechanism | Extend `DriverFactory`; serialize a functions-stripped subset over IPC |
| EXPLAIN v1 | **Lean collapsible tree** (labels + cost/rows badges) or text; no rich visualizer |
| Default transaction mode | Read from connection profile (`defaultAutoCommit`), inherited per tab |
| Runtime capabilities | Optional per-connection overlay on top of static per-type caps (the "wrinkle") |

---

## Section 1 — Capability framework

Three new **optional** capability blocks on `DriverFactory`, mirroring how
`quoteChar` / `sampleQuery` work today. A driver that omits a block does not get
that UI.

```ts
interface DriverFactory {
  // ...existing...
  session?: SessionCapability               // transactions / auto-commit / read-only
  explain?: ExplainCapability               // execution plans
  sessionInspection?: InspectionCapability  // process list + kill

  // Optional per-connection overlay (the "wrinkle" — see Section 5).
  // SQL drivers omit it; Mongo uses it to declare manualTransactions only on
  // replica-set topologies. Receives the live adapter; returns a partial overlay.
  getRuntimeCapabilities?(adapter: DbAdapter): Promise<RuntimeCapabilityOverlay>
}

interface SessionCapability {
  autoCommit: boolean                  // can the auto-commit toggle be shown?
  manualTransactions: boolean          // BEGIN / COMMIT / ROLLBACK
  isolationLevels?: string[]           // selectable levels; absent ⇒ no picker
  readOnly?: boolean                   // read-only session/txn supported
  savepoints?: boolean                 // declared now; UI deferred (see Future work)
  /** What this engine calls a transaction. Redis="MULTI/EXEC", Mongo="Session".
   *  Defaults to "Transaction". Lets the UI label generically. */
  transactionLabel?: string
  /** Whether rollback is real (PG/MySQL) or best-effort (Redis DISCARD). */
  rollbackKind?: 'full' | 'discard'
}

interface ExplainCapability {
  supportsAnalyze: boolean             // an "analyze" variant that actually runs the query
  format: 'tree' | 'text'              // 'tree' ⇒ renderer draws ExplainNode tree; 'text' ⇒ raw text
}

interface InspectionCapability {
  canKill: boolean
}

/** Only the fields a driver may flip at connect time. Intentionally a subset of
 *  SessionCapability / InspectionCapability — never the EXPLAIN format, which is
 *  fixed per driver. */
interface RuntimeCapabilityOverlay {
  session?: Partial<Pick<SessionCapability, 'manualTransactions' | 'isolationLevels' | 'readOnly'>>
  sessionInspection?: Partial<InspectionCapability>
}
```

### Serialization

`db:driver-capabilities` (already exists, keyed by type) gains a functions-stripped
echo of the static blocks (presence + data fields). The renderer keeps reading flags;
nothing in `src/main` or the renderer learns what "postgresql" means — it only sees
`session.manualTransactions === true`.

```ts
interface DriverCapabilities {
  // ...existing fields...
  session?: SessionCapability          // already function-free
  explain?: ExplainCapability
  sessionInspection?: InspectionCapability
}
```

---

## Section 2 — Session & transaction runtime (per-tab, lazy pinning)

`DbAdapter` gains optional methods, guarded by capability flags (same convention as
today's optional `setSchema?` / `switchWarehouse?`):

```ts
interface DbAdapter {
  // query() gains an optional opts arg — backward compatible
  query(sql: string, params?: unknown[], opts?: QueryOpts): Promise<QueryResult>

  openSession?(sessionId: string, opts?: SessionOpts): Promise<void>   // pins a dedicated connection
  closeSession?(sessionId: string): Promise<void>                      // releases it
  setAutoCommit?(sessionId: string, enabled: boolean): Promise<void>
  beginTransaction?(sessionId: string, opts?: SessionOpts): Promise<void>
  commit?(sessionId: string): Promise<void>
  rollback?(sessionId: string): Promise<void>

  explain?(sql: string, opts?: { analyze?: boolean }): Promise<ExplainResult>
  listSessions?(): Promise<DbSession[]>
  killSession?(id: string | number): Promise<void>
}

interface QueryOpts { sessionId?: string; timeoutMs?: number }
interface SessionOpts { autoCommit?: boolean; readOnly?: boolean; isolationLevel?: string }
```

### Lifecycle (solves the pool problem)

- A tab in **auto-commit ON** mode runs `query(sql)` with no `sessionId` → uses the
  pool as today. No pinned connection, zero overhead.
- When a tab flips to **auto-commit OFF** (or opens a manual txn), the core generates
  a stable `sessionId` (one per tab) and calls `openSession(sessionId, …)`. The
  adapter **pins one dedicated client** from the pool and routes that session's
  queries to it. Subsequent statements run inside an implicit/explicit transaction
  on that pinned client.
- `commit` / `rollback` end the current txn but keep the client pinned — auto-commit-off
  immediately starts the next txn, like real clients.
- Tab close, or flipping back to auto-commit ON → `closeSession` releases the client.
  Closing with an open txn triggers a commit/rollback guard first (Section 4).

The adapter owns a `Map<sessionId, pinnedClient>` internally — one adapter per
connection still serves many tab-sessions, and `switchDatabase` / pool semantics are
untouched for ordinary queries. `disconnect()` must release all pinned sessions.

---

## Section 3 — Per-feature data contracts

```ts
// EXPLAIN — driver returns ONE shape, matching ExplainCapability.format
interface ExplainResult {
  format: 'tree' | 'text'
  text?: string                 // format:'text' — raw plan (SQLite, Mongo .explain JSON)
  root?: ExplainNode            // format:'tree' — PG/MySQL structured plan
}
interface ExplainNode {
  label: string                 // "Seq Scan on users"
  detail?: string               // "cost=0.00..18.10 rows=810"
  rows?: number
  actualRows?: number           // present only when analyze ran
  durationMs?: number
  children: ExplainNode[]
}

// Session inspection — process / connection list
interface DbSession {
  id: string | number           // pid / connection id / Mongo opid
  user?: string
  database?: string
  state?: string                // 'active' | 'idle in transaction' | ...
  query?: string                // current statement
  durationMs?: number
  isCurrent?: boolean           // is this our own session? (protected from self-kill)
}
```

### New IPC channels

Added to `IpcChannelMap`, handled in `src/main/ipc/db.ts` alongside existing `db:*`
handlers. Each is a thin guard reusing `requireAdapter`: look up adapter → check the
optional method exists → call it.

- `db:session:open`, `db:session:close`, `db:session:set-autocommit`
- `db:txn:begin`, `db:txn:commit`, `db:txn:rollback`
- `db:explain` → `ExplainResult`
- `db:sessions:list` → `DbSession[]`, `db:sessions:kill`
- `db:connection-capabilities` (profileId) → `RuntimeCapabilityOverlay | null` (Section 5)

Drivers own **all** dialect SQL — `pg_stat_activity` / `pg_terminate_backend`,
`SHOW PROCESSLIST` / `KILL`, `EXPLAIN (FORMAT JSON)` vs `EXPLAIN QUERY PLAN`. The
main process never writes engine-specific SQL.

---

## Section 4 — Renderer UX surfaces

All driven by capability flags; absent flag ⇒ control not rendered. The renderer
never branches on db type.

### 1. Transaction toolbar (query editor header, near Run)

- **Auto-commit toggle** — shown when `session.autoCommit`. Per-tab.
- **Commit / Rollback buttons** — shown when `session.manualTransactions`; enabled
  only while a txn is active. Labeled via `transactionLabel`; rollback labeled
  "Discard" when `rollbackKind === 'discard'` (Redis).
- **Transaction status pill** — `idle` / `active`. When idle-in-transaction, a subtle
  warning tint.
- **Isolation / read-only** — a small dropdown when `isolationLevels` / `readOnly`
  are present.

### 2. `tabs.ts` per-tab session state

```ts
interface QueryTabTxnState {
  autoCommit: boolean
  status: 'none' | 'active'      // 'none' = autocommit on, or no open txn
  isolationLevel?: string
  readOnly: boolean
}
```

Default `autoCommit: true`. The default mode is read from the connection profile
(persisted `defaultAutoCommit`, DataGrip-style "per data source"), so a production
connection can default to manual-commit and every new tab inherits it.

### 3. Close-guard

Closing a tab (or the app) with `status: 'active'` prompts Commit / Rollback / Cancel.
Reuses existing toast/dialog primitives.

### 4. EXPLAIN

An "Explain" action beside Run. Result opens in the results area as a **lean
collapsible tree** (`ExplainNode` tree, cost/rows badges, hot nodes tinted) or a
**text panel** — chosen by `format`. No new tab type; it is a result-view mode.

### 5. Sessions panel

A panel via the existing `PanelRegistry` / `UIRegistry` SDK, listing `DbSession[]`
with refresh + a Kill action gated on `canKill`. `isCurrent` rows are protected from
self-kill.

---

## Section 5 — Per-driver capabilities & the runtime overlay

| Driver | `session` | manualTxn / isolation | EXPLAIN | inspection | notes |
|---|---|---|---|---|---|
| PostgreSQL | ✅ | ✅ / 4 levels + readOnly | `tree` (`FORMAT JSON`, analyze) | ✅ `pg_stat_activity` / `pg_terminate_backend` | pin a `pg.PoolClient` per session |
| MySQL | ✅ | ✅ / 4 levels | `tree` (`EXPLAIN FORMAT=JSON`, no analyze) | ✅ `SHOW PROCESSLIST` / `KILL` | pin a `mysql2` connection per session |
| SQLite | ✅ | ✅ / no isolation picker | `text` (`EXPLAIN QUERY PLAN`) | — (no server sessions) | `better-sqlite3` single-connection; readOnly = `?mode=ro` |
| Snowflake | ✅ | ✅ / READ COMMITTED only | `text` (`EXPLAIN`) | `canKill:false` v1 (query history only) | session `AUTOCOMMIT` param |
| MongoDB | ✅ | ✅ replica-set only / no isolation | `text` (`.explain()` JSON) | ✅ `currentOp` / `killOp` | `transactionLabel:"Session"`; manualTxn declared via runtime overlay |
| Redis | ✅ | ✅ / `rollbackKind:'discard'` | — | ✅ `CLIENT LIST` / `CLIENT KILL` | `transactionLabel:"MULTI/EXEC"`; commit=`EXEC`, rollback=`DISCARD` |

After step 1, each driver lights up purely by declaring caps — no further core changes.

### The runtime-capability overlay (the "wrinkle") — kept isolated

MongoDB's `manualTransactions` depends on the live topology (replica set vs
standalone), which is unknown until connected. To support this **without** making the
project harder, the overlay is constrained to a single, well-bounded code path:

1. **Static caps stay the default and unchanged.** `db:driver-capabilities` (by type)
   and its renderer cache (`driver-capabilities` store, keyed by type) are untouched.
   A driver with no `getRuntimeCapabilities` exercises **zero** new code — behavior is
   byte-for-byte today's.

2. **The overlay is a narrow, same-shaped subset.** `RuntimeCapabilityOverlay` can
   only flip a handful of pre-existing fields (`session.manualTransactions`,
   `session.isolationLevels`, `session.readOnly`, `sessionInspection.canKill`).
   It cannot introduce new capability kinds
   or change `explain.format`. This caps the blast radius.

3. **One merge point, one selector.** The renderer exposes a single
   `resolveCapabilities(profileId, type)` selector that shallow-merges the
   connection-scoped overlay (keyed by `profileId`) over the static type caps.
   Components call only this selector — they never merge by hand, so there is exactly
   one source of truth. The connection-scoped cache invalidates on disconnect.

4. **Resolved once, at connect.** `db:connection-capabilities` is fetched after a
   successful connect and cached per `profileId`; it is not re-queried per render.
   Disconnect clears it.

This keeps the overlay an opt-in detail of one driver rather than a pervasive special
case: the common path is unchanged, the merge is centralized, and the overlay shape is
deliberately too small to grow into a parallel capability system.

---

## Section 6 — Testing & rollout

### Tests

- **Unit (`tests/unit/`, vitest):**
  - Capability serialization — functions stripped, flags correct, overlay merge
    precedence in `resolveCapabilities`.
  - Session lifecycle state machine in the tabs store — autocommit toggle →
    open/close session calls; begin/commit/rollback transitions; close-guard.
  - `ExplainNode` tree mapper per driver against captured fixture plans.
  - Adapter session logic against real in-memory SQLite and mocked pg/mysql clients
    (pinning, release on disconnect, no leaked clients).
- **Storybook (Playwright project + a11y):**
  - Transaction toolbar across flag combinations — autocommit-only, full txn,
    Redis discard-labeled, read-only, isolation picker.
  - Txn status pill states; EXPLAIN lean tree; sessions panel with `isCurrent`
    protection.

### Rollout order

1. Capability framework + IPC + serialization + `resolveCapabilities` selector.
2. Session/txn runtime in **PostgreSQL + SQLite** + toolbar + tabs-store state + close-guard.
3. EXPLAIN (lean tree for PG, text for SQLite).
4. Sessions panel.
5. Remaining drivers: MySQL, Snowflake, Mongo (incl. runtime overlay), Redis.

---

## Future work (for future AI agents / contributors)

These are intentionally deferred from v1. They fit the surface above without redesign:

- **Rich EXPLAIN visualizer** — per-node timing bars, % of total time, slowest-path
  highlighting (à la pev / DataGrip). v1 ships only the lean collapsible tree. The
  `ExplainNode` contract already carries `actualRows` / `durationMs` to feed this
  later; no contract change needed.
- **Savepoint UI** — `SessionCapability.savepoints` is declared now; the
  begin/release/rollback-to-savepoint UI is deferred.
- **Multiple concurrent named sessions per tab** — current model is one session per
  tab. A first-class `Session` abstraction could decouple sessions from tabs if
  multi-console-per-tab is ever wanted.
- **Large-result streaming / server-side cursors** — separate spec; touches the
  AG-Grid data path, not the session model.
