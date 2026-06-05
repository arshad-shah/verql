# Internal SQLite app-data store

> **Status: IMPLEMENTED.** This document specified moving Verql's *high-growth*
> renderer `localStorage` datasets (AI conversations, saved queries) onto a
> dedicated, main-process SQLite database, and that work has landed. The store
> is `src/main/appdata/store.ts` (`AppDataStore`, file `${userData}/app.db`),
> wired through the `appdata:*` IPC channels (`src/main/ipc/appdata.ts`); the
> renderer consumes it from `stores/ai.ts` and the saved-queries module, both of
> which migrate their legacy `localStorage` payload on first launch. The
> document is retained as the design record; the section below describes what was
> built.

**Summary.** Verql persists app data in three places today: a JSON config file
(`config.json`) and an encrypted keyring blob (`credentials.enc`) in the main
process, and a handful of `localStorage` keys in the renderer. The
main-process JSON files are small, bounded, and well-served by their current
atomic-write design — **they should stay as they are.** The renderer's
`localStorage` datasets are the problem: **AI conversations**
(`verql:ai-conversations`) and, to a lesser degree, **saved queries**
(`verql:saved-queries`) grow without bound, are rewritten in full on every
change, and share the browser's ~5–10 MB `localStorage` quota — a hard wall
that, once hit, silently drops writes. This proposal introduces a single
internal SQLite database (`app.db` in `userData`), owned by the main process
behind typed IPC, and migrates those two datasets onto it. `better-sqlite3` is
**already a bundled dependency** (it's the SQLite *driver*), so this adds no new
technology — only a new internal consumer of one we already ship.

This is a **targeted** migration, explicitly *not* a wholesale move of all
persistence to a database. Connections, settings, and secrets stay in
`config.json` + `credentials.enc`.

---

## 1. Goals & non-goals

### Goals

| # | Goal | What it buys |
|---|------|--------------|
| G1 | **Remove the `localStorage` quota cliff** | AI history with tool calls hits the ~5–10 MB cap quickly; past the cap, writes throw `QuotaExceededError` and are swallowed (`persistConversations`'s empty `catch`), losing data. SQLite has no practical size cap. |
| G2 | **Incremental writes** | Today every new message re-serializes and rewrites the *entire* conversation list (`ai.ts` subscribe → `persistConversations`). SQLite lets us write one row per message/conversation — O(change), not O(total). |
| G3 | **Queryability** | Indexed lookups, pagination, full-text search over history, and cheap "most-recent N conversations" — none of which a single JSON blob supports. |
| G4 | **Durability** | WAL-mode SQLite gives transactional, crash-safe writes, replacing best-effort JSON serialization that can be torn by a quota error mid-write. |
| G5 | **One internal store, room to grow** | A single `app.db` becomes the home for future app-owned, growable datasets (query history, usage stats) without inventing a new file each time. |

### Non-goals

- **NG1 — Migrating connections/settings.** `config.json` is small (<100 KB),
  bounded, rarely written, already atomic, human-readable, and trivially
  backed up. Moving it into SQLite buys nothing and costs readability and the
  simple keyring secret-stripping flow (`stripSecretsForDisk`). **Out of scope.**
- **NG2 — Migrating secrets.** `credentials.enc` (OS-keychain–encrypted via
  `safeStorage`, mode `0o600`) is the right tool. **Out of scope.**
- **NG3 — Replacing in-memory caches.** The activity-log ring buffer
  (`src/main/activity/log.ts`) and the schema cache
  (`stores/schema.ts`) are deliberately ephemeral. **Out of scope.**
- **NG4 — An ORM.** `better-sqlite3` with hand-written SQL and prepared
  statements is sufficient and matches the project's "thin glue" ethos. No
  Prisma/Drizzle.
- **NG5 — Exposing this DB to plugins.** This is host infrastructure. If
  plugins later need durable storage, that is a separate SDK surface
  (`PluginSettings` already exists for small KV needs).

---

## 2. Why this fits the architecture

- **Ownership boundary (`CLAUDE.md`).** This is *glue*, not domain logic: a
  storage seam plus IPC, owned by the main app. We are not putting
  dialect/format/provider behavior here. ✔
- **Dependency cost is ~zero.** `better-sqlite3` is already installed,
  externalized in `electron.vite.config.ts`, and rebuilt by `pnpm postinstall`.
  We reuse it in-process. ✔
- **Process placement.** Durable app data belongs in the main process behind
  IPC, exactly like `ConfigStore`. The renderer stays a client. The current
  AI-conversation code lives in the *renderer* and writes `localStorage`
  directly — so this migration's real work is **relocating ownership across the
  IPC boundary**, not just swapping a storage backend. (See §6 risks.)
- **Precedent.** `ConfigStore` (`src/main/config/store.ts`) already models the
  pattern: a main-process class wrapping a file, atomic writes, a change-listener
  fan-out, and IPC handlers in front. `AppDataStore` mirrors it.

---

## 3. High-level design

```
┌─ Main process ───────────────────────────────────────────────┐
│                                                               │
│  AppDataStore  (src/main/appdata/store.ts)                    │
│  ├─ better-sqlite3 Database  →  ${userData}/app.db  (WAL)     │
│  ├─ migrations runner (user_version pragma)                   │
│  ├─ conversations repository                                  │
│  └─ savedQueries repository                                   │
│         ▲                                                     │
│         │ called by                                           │
│  IPC handlers (src/main/ipc/appdata.ts)                       │
│    appdata:conversations:*   appdata:saved-queries:*          │
└─────────┼─────────────────────────────────────────────────────┘
          │ typed IPC (shared/ipc.ts)
          ▼
┌─ Renderer ────────────────────────────────────────────────────┐
│  stores/ai.ts          → IPC instead of localStorage          │
│  saved-queries panel   → IPC instead of localStorage          │
│  (one-time migration of existing localStorage payloads)       │
└───────────────────────────────────────────────────────────────┘
```

A single `Database` handle is opened once at boot, configured with
`PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`, and shared by both
repositories. `better-sqlite3` is synchronous, which is fine on the main
process for these small, fast statements; long scans (if any are ever added)
should move to a `utilityProcess`, but nothing here needs that.

---

## 4. Schema

`user_version` drives migrations (see §5). Initial schema (`v1`):

```sql
-- Conversations -------------------------------------------------
CREATE TABLE conversations (
  id              TEXT PRIMARY KEY,          -- crypto.randomUUID()
  title           TEXT NOT NULL,
  created_at      INTEGER NOT NULL,          -- epoch ms
  updated_at      INTEGER NOT NULL,          -- epoch ms
  total_input_tokens  INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  tool_call_count     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages ------------------------------------------------------
CREATE TABLE messages (
  id               TEXT PRIMARY KEY,         -- AIChatMessage.id
  conversation_id  TEXT NOT NULL
                     REFERENCES conversations(id) ON DELETE CASCADE,
  seq              INTEGER NOT NULL,         -- order within conversation
  role             TEXT NOT NULL,            -- user|assistant|tool|system
  content          TEXT NOT NULL,
  timestamp        INTEGER NOT NULL,         -- epoch ms
  -- Structured extras kept as JSON so the AIChatMessage shape can evolve
  -- without a migration: toolCalls, toolCallId, isError, usage, etc.
  extra            TEXT                       -- JSON or NULL
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, seq);

-- Saved queries -------------------------------------------------
CREATE TABLE saved_queries (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  sql              TEXT NOT NULL,
  connection_type  TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_saved_queries_updated_at ON saved_queries(updated_at DESC);
```

**Design notes.**

- **Messages are first-class rows**, not a JSON blob on the conversation. This is
  the whole point of G2/G3: appending a message is one `INSERT`, and loading a
  conversation is one indexed `SELECT … ORDER BY seq`.
- **`extra` JSON column** absorbs the discriminated-union fields of
  `AIChatMessage` (`toolCalls`, `toolCallId`, `isError`, …). This avoids a wide,
  sparse table and a migration every time the message shape changes, while
  keeping the hot columns (role, content, timestamp, ordering) native. The
  renderer (re)hydrates `AIChatMessage` from columns + parsed `extra`.
- **`stats` is denormalized onto `conversations`** (three integer columns)
  rather than recomputed, matching today's `SessionStats` shape.
- **`ON DELETE CASCADE`** makes `deleteConversation` a single `DELETE` and keeps
  messages from orphaning. Requires `PRAGMA foreign_keys = ON` per connection.
- **Optional FTS (deferred).** A `messages_fts` virtual table (FTS5) would make
  history search instant. Listed in §8 follow-ups, not in v1.

---

## 5. Migrations

A tiny forward-only runner keyed on `PRAGMA user_version`:

```ts
const MIGRATIONS: ((db: Database) => void)[] = [
  /* v1 */ (db) => db.exec(SCHEMA_V1),
  // future: /* v2 */ (db) => db.exec('ALTER TABLE …'),
]

function migrate(db: Database) {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < MIGRATIONS.length; v++) {
    const run = db.transaction(() => {
      MIGRATIONS[v](db)
      db.pragma(`user_version = ${v + 1}`)
    })
    run()
  }
}
```

Each migration runs in a transaction with the version bump, so a crash leaves
`user_version` consistent with the applied schema. No down-migrations (desktop
app; we never roll a user's DB backward).

---

## 6. One-time data migration from `localStorage`

The existing payloads live in the renderer and must be imported on first run of
the new build. Two viable shapes:

1. **Renderer-driven (recommended).** On boot, the renderer reads the legacy
   `localStorage` keys; if present and the corresponding tables are empty, it
   ships the parsed objects to main via a one-shot
   `appdata:conversations:import` / `appdata:saved-queries:import` IPC call, then
   removes the legacy keys (mirroring the existing
   `verql-theme`/`verql-sidebar-width` cleanup in `src/renderer/src/main.tsx`).
   Simple, no main-process access to renderer storage required.
2. Main-driven: not possible directly — `localStorage` is renderer-only — so (1)
   is effectively mandatory.

Migration is **idempotent**: guard on "table empty AND legacy key present", and
only delete the legacy key after the import IPC resolves successfully. If the
import fails, leave the `localStorage` data in place so a later launch retries —
never delete the source before the destination is durably written.

---

## 7. IPC surface

New channels in `shared/ipc.ts` (`IpcChannelMap`), handlers in
`src/main/ipc/appdata.ts`, registered from `src/main/ipc-handlers.ts`. Naming
follows the `domain:action` convention.

| Channel | Args | Return |
|---|---|---|
| `appdata:conversations:list` | `[]` | `ConversationSummary[]` (no messages — id, title, stats, timestamps) |
| `appdata:conversations:get` | `[id]` | `Conversation \| null` (with messages) |
| `appdata:conversations:upsert` | `[Conversation]` | `void` |
| `appdata:conversations:append-message` | `[convId, AIChatMessage]` | `void` (hot path; one INSERT) |
| `appdata:conversations:rename` | `[id, title]` | `void` |
| `appdata:conversations:delete` | `[id]` | `void` |
| `appdata:conversations:import` | `[Conversation[]]` | `{ imported: number }` (migration) |
| `appdata:saved-queries:list` | `[]` | `SavedQuery[]` |
| `appdata:saved-queries:upsert` | `[SavedQuery]` | `void` |
| `appdata:saved-queries:delete` | `[id]` | `void` |
| `appdata:saved-queries:import` | `[SavedQuery[]]` | `{ imported: number }` |

`list` deliberately returns **summaries without message bodies** so the
conversation switcher stays cheap; full messages load lazily via `get` on
switch. This is the concrete payoff of G3 over the current "everything in one
blob" model.

Document these in `docs/ipc.md` per the repo's "update the doc in the same
change" rule.

---

## 8. Renderer changes (`stores/ai.ts`, saved-queries panel)

The current `ai.ts` keeps `conversations` fully in memory and persists the whole
array via a `subscribe` hook. The migration:

- Replace `loadConversations`/`persistConversations` (localStorage) with IPC.
- On boot, `appdata:conversations:list` for the switcher; `appdata:conversations:get`
  for the active one. Keep the active conversation's messages in memory as today
  (the streaming loop needs them).
- The `subscribe` persistence hook becomes an `append-message` /
  `upsert` call instead of a full-array rewrite. For streaming, persist on
  message-settled boundaries (the `done`/`tool-result` events), not per chunk —
  matching the existing "reacts only to message/stat changes, not streaming
  chunks" guard.
- Saved-queries panel: swap its `useSyncExternalStore` localStorage backing for
  IPC-backed state (it already centralizes load/persist in two functions, so the
  blast radius is small).

**This is the largest single piece of work** and the main risk (§9), because it
moves conversation ownership from renderer to main across IPC. It can ship
behind the migration so old data is never stranded.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Renderer→main ownership shift** for AI conversations is a real refactor, not a backend swap. | Land it behind the idempotent migration; keep `AI_MESSAGES_SET`/`AI_MESSAGES_CLEAR` semantics intact; ship in one PR so the store is never half-migrated. |
| **`better-sqlite3` is synchronous** on the main process. | Statements here are tiny and indexed; prepared statements + WAL keep them sub-millisecond. Revisit `utilityProcess` only if a future scan-heavy feature lands. |
| **Native module / packaging.** | Already handled — it's the SQLite driver today, externalized and rebuilt in `postinstall`. No new build config. |
| **Data loss during migration.** | Delete legacy `localStorage` keys only after the import IPC resolves; guard import on empty-table; idempotent retry. |
| **Corruption.** | WAL + transactional migrations; on open failure, quarantine `app.db` (rename aside) and start fresh rather than crash-loop — surface a notification so the user knows history was reset. |
| **Tests.** | `AppDataStore` takes a path like `ConfigStore`; unit tests use `:memory:` or a tmp file. No Electron needed for the store layer. |

---

## 10. Implementation checklist

1. `src/main/appdata/store.ts` — `AppDataStore` (open, pragmas, migration
   runner, two repositories), modeled on `ConfigStore`.
2. Wire it into main boot next to `ConfigStore`/`KeyringService`; close on quit.
3. `shared/ipc.ts` — add the channels in §7; `src/main/ipc/appdata.ts` +
   register in `ipc-handlers.ts`.
4. `stores/ai.ts` — replace localStorage with IPC; persist incrementally.
5. Saved-queries panel — IPC-backed store.
6. One-time migration + legacy-key cleanup (§6).
7. Unit tests for `AppDataStore` (`:memory:`); update `docs/ipc.md` and
   `docs/ai.md` (conversation persistence section) + `CLAUDE.md` (state-management
   notes mention AI history in localStorage — update to the DB).
8. Flip this proposal's status to "implemented" / fold the durable bits into the
   relevant docs.

---

## 11. Decision

**Recommended: do it, scoped to AI conversations (primary) and saved queries
(secondary).** The benefit is concrete (no quota cliff, incremental writes,
queryable history), the dependency cost is zero, and it fits the existing
main-process + IPC pattern. Leave `config.json`, `credentials.enc`, and the
in-memory caches alone. The one cost to budget for is the `ai.ts`
ownership-relocation refactor — the rest is mechanical.
