# Activity & logging

The **Activity log** is Verql's single, unified stream of "what's happening" —
queries the app ran, AI/MCP tool calls, connection lifecycle, notifications,
outbound network requests, and now general **diagnostic log lines** from the
glue. One stream feeds two audiences: **users** (a readable, filterable record
of what the app did) and **developers** (in-app diagnostics, no log files to dig
out of `userData`). It is also exposed to agents read-only via a shared tool.

It follows Verql's **orchestrator + plugins** rule: the host owns the stream
(glue); recording happens at the points where things actually occur.

- [The pieces](#the-pieces)
- [The `log` kind and the app logger](#the-log-kind-and-the-app-logger)
- [Clever processing: batching & pause](#clever-processing-batching--pause)
- [The Activity panel](#the-activity-panel)
- [Data model](#data-model)
- [Where the code lives](#where-the-code-lives)

## The pieces

| Layer | Owns | Lives in |
|-------|------|----------|
| **`ActivityLog`** (host glue) | an in-memory ring buffer (cap 1000); `record` / `list` / `subscribe` / `clear`; provided as the `activity-log` service | `src/main/activity/log.ts` |
| **`ActivityBatcher`** (host glue) | coalesces appended entries into batches before they cross IPC | `src/main/activity/batcher.ts` |
| **`Logger`** (host glue) | mirrors a log line to the console **and** records it as a `log` entry; provided as the `logger` service | `src/main/logging/logger.ts` |
| **Recorders** | call `activityLog.record(...)` where things happen (db queries, connect/disconnect, tool calls, notifications, network) | `src/main/ipc/db.ts`, `ipc-handlers.ts`, `src/main/mcp/server.ts`, … |
| **Renderer store** | mirrors the stream (cap 1000), applies each IPC batch in one update | `src/renderer/src/stores/activity.ts` |
| **Activity panel** | filter (kind + level), search, pause, export, expand-detail UI | `src/renderer/src/components/shell/ActivityPanel.tsx` |

Entries are deliberately free of secrets, and every stored text field is clipped
to 2000 chars so a giant SQL/error can't bloat the ring or the IPC payload.

## The `log` kind and the app logger

Activity entries have a `kind` and a `level`. Alongside the existing kinds
(`query`, `tool-call`, `connection`, `notification`, `network`) there is a `log`
kind for general diagnostics, and the level set adds `debug` (so `debug` →
`info` → `success` / `warn` → `error`).

`createLogger(sink, scope)` returns a `Logger` with `debug` / `info` / `warn` /
`error(message, detail?)` and a `child(scope)` for narrower scopes
(`app` → `app:plugins`). Each call:

1. mirrors to the matching `console` method (terminal / devtools unchanged), and
2. records a `log` entry — `title` = message, `source` = scope, `detail` = the
   serialized detail (an `Error` becomes its stack; an object becomes pretty JSON).

The host provides it as the `logger` service so plugins can log into the same
stream, and wires a few glue call-sites (plugin boot, MCP auto-start, drag-drop)
through it instead of raw `console.error`.

## Clever processing: batching & pause

Recording is cheap, but **one IPC message per entry** is not — a migration, a
chatty AI loop, or verbose `debug` logging can produce a burst. Two seams keep
the UI smooth:

- **Batching (main → renderer).** `ActivityLog.subscribe` feeds an
  `ActivityBatcher`, which buffers entries and flushes a single `activity:batch`
  IPC payload when either the buffer hits `maxBatch` (50) **or** `intervalMs`
  (100 ms) elapses since the first buffered entry. The renderer applies each
  batch in one Zustand `set`, so a burst is a few re-renders, not hundreds.
- **Pause (renderer).** The panel can freeze on a snapshot so a fast stream
  can't yank rows out from under a reader; entries keep accumulating in the
  store and reappear on resume.

The panel also caps **rendered** rows (400) independently of how many the store
keeps, while export still sees every matching entry.

## The Activity panel

`ActivityList` is presentational and store-free (used by the panel and
Storybook); it owns its own filter/search/pause state. `ActivityPanel` is the
thin container that wires the live store. Controls:

- **Search** — free-text across title, detail, and source.
- **Kind chips** and **level chips** — multi-select; empty = show all.
- **Pause / resume** — freeze the displayed snapshot.
- **Export** — download the matching entries as JSON (`verql-activity-<ts>.json`).
- **Clear** — empties the log (via `activity:clear`).

## Data model

```ts
type ActivityKind  = 'query' | 'tool-call' | 'connection' | 'notification' | 'network' | 'log'
type ActivityLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

interface ActivityEntry {
  id: string
  ts: number          // epoch ms
  kind: ActivityKind
  level: ActivityLevel
  title: string        // short headline
  detail?: string      // longer text (SQL, error, serialized log detail)
  source?: string      // connection id/name, provider/tool id, or logger scope
  durationMs?: number
}
```

`ActivityQuery` filters `list()` by `kinds`, `levels`, `sinceTs`, and `limit`.

## Where the code lives

| Concern | File |
|---------|------|
| Shared types | `shared/activity.ts` |
| Activity ring buffer | `src/main/activity/log.ts` |
| IPC batcher | `src/main/activity/batcher.ts` |
| App logger | `src/main/logging/logger.ts` |
| Host wiring (provide services, stream batches, recorders) | `src/main/ipc-handlers.ts` |
| IPC channels / events | `shared/ipc.ts` (`activity:list`, `activity:clear`, `activity:batch`) |
| Renderer store | `src/renderer/src/stores/activity.ts` |
| Activity panel UI | `src/renderer/src/components/shell/ActivityPanel.tsx` |
| Tests | `tests/unit/activity-log.test.ts`, `tests/unit/activity-batcher.test.ts`, `tests/unit/logger.test.ts`, `tests/unit/components/shell/activity-list.test.tsx` |

See also: [notifications.md](./notifications.md) for the **attention seam** (a
separate concern — "your response is needed", not a passive record), and
[architecture.md](./architecture.md) for where the activity log sits among the
main-process subsystems.
