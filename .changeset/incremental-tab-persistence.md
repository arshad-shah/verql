---
"verql": minor
---

Persist open tabs incrementally to SQLite instead of localStorage.

Restore-on-startup for open query tabs moves off a renderer-`localStorage`
snapshot — which rewrote *every* tab on *every* change, synchronously on the UI
thread, and silently dropped saves at the ~5 MB origin quota — and onto the
existing main-process SQLite app-data store, behind a per-tab-incremental engine.

- **Durable layer** — a new `open_tabs` table (one row per tab); `listOpenTabs()`
  / `applyOpenTabOps()` apply an upsert/delete/active batch in a single
  transaction, over two typed IPC channels.
- **Engine** (`src/renderer/src/lib/tab-persistence/`) — a pure `select` +
  `diff` core (a single-tab edit yields exactly one row write, regardless of tab
  count), a debounced/coalesced/serialized write loop whose baseline only
  advances after a successful write (so a failed write retries instead of being
  lost), an IPC transport, and a one-time migration of the legacy localStorage
  payload.
- Tabs keep their identity across restore, so writes stay incremental. The
  persisted query buffer is treated as **opaque, driver-agnostic text** (SQL,
  MongoDB, Redis, …) — never parsed.

Result: tab writes leave the UI thread, cost is bounded by what changed, there's
no quota cliff, and commits are crash-safe (WAL). Existing localStorage tabs are
migrated automatically on first launch.
