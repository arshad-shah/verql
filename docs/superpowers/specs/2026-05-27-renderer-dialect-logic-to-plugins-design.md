# Moving renderer DB/dialect logic into plugins — Design

**Date:** 2026-05-27
**Status:** Design only — not implemented. Mechanism approved: **serializable descriptors**.

## Problem

Per the ownership principle (main app = UI + glue; plugins own db/theme/ai/format
logic), the renderer should not contain database-dialect logic. Today it does:

| File | Dialect logic |
|------|---------------|
| `renderer/lib/db-error.ts` | ~30 Postgres/MySQL/SQLite error-string patterns → codes |
| `renderer/lib/plan-parser.ts` | Postgres `EXPLAIN` text + JSON plan parsing |
| `renderer/lib/statement-contributions/{sql,mongodb,redis}.ts` + `index.ts` | per-dialect statement splitters; renderer branches on db type |
| `renderer/components/query/QueryPanel.tsx` | DDL / destructive-query / no-`WHERE` regexes |
| `renderer/components/explorer/TableNode.tsx`, `ViewNode.tsx` | hardcoded `SELECT * … LIMIT 100` fallback |

**Root cause (why it's not just sloppiness):** plugins run in **main**, but the
editor needs this logic **synchronously, in the renderer** (statement splitting
for run-selection/CodeLens on every keystroke; error classification and plan
parsing for display). There is currently no channel for a plugin to contribute
*renderer-side* behavior, so it was hardcoded.

## Chosen mechanism: serializable descriptors

Plugins declare this behavior as **data** (not code) in their driver
registration. The descriptors are shipped to the renderer at boot, and the
renderer keeps a small set of **generic interpreters** that run over the
descriptors. The renderer stays synchronous (no per-keystroke IPC) and stops
branching on db type; new database plugins get the behavior by declaring data.

**Reuse the existing capability channel.** The renderer already fetches
per-driver capabilities through `useDriverCapabilitiesStore.fetch(type)` (backed
by `shared/driver-capabilities.ts` + a `driver-capabilities` IPC). Extend
`DriverCapabilities` with the descriptors below rather than inventing a new
channel. Drivers populate them in their `ctx.drivers.register(...)` call; the
orchestrator serializes them; the renderer caches them.

### Descriptor schema (additions to `DriverCapabilities`)

```ts
interface DriverCapabilities {
  // …existing…

  /** How the editor splits a buffer into statements. */
  statements?: {
    splitter: 'sql' | 'lines' | 'braces'   // names a generic interpreter the renderer ships
    keywords?: string[]                     // statement-leading keywords for CodeLens labels
  }

  /** Dialect error-string → structured code. Patterns are plain regex sources. */
  errorPatterns?: { pattern: string; flags?: string; code: string; message: string }[]

  /** Which plan parser the renderer should use for EXPLAIN output. */
  planFormat?: 'pg-text' | 'pg-json' | 'none'

  /** Optional override of the generic DDL/destructive classifiers. */
  sqlClassification?: { ddl?: string; destructive?: string }
}
```

The renderer keeps the *implementations* (`splitSqlStatements`, the brace/line
splitters, the PG plan parsers, the regex matcher) as **generic interpreters**;
it just stops hardcoding the type→behavior map and reads the descriptor instead.

### Per-concern plan

1. **Statement splitting (hot path).** Drivers declare `statements.splitter` +
   `keywords`. `statement-contributions/index.ts` stops mapping db type →
   splitter; it looks the descriptor up from the capabilities cache. The
   mongodb/redis splitters move out of the renderer into a generic `braces` /
   `lines` interpreter selected by descriptor. (Duplicate `splitSqlStatements`
   in `sdk/sql-statements.ts` and the renderer collapses to one source: the SDK
   one for main, and the renderer keeps a generic copy driven by the descriptor
   — or we expose the rules and the renderer interprets them.)

2. **Error classification.** Drivers declare `errorPatterns`. `db-error.ts`
   becomes a generic matcher that walks the active connection's patterns (plus a
   small set of cross-cutting app/IPC patterns that are *not* dialect-specific
   and legitimately stay in the app). Patterns are validated for ReDoS-safety at
   registration.

3. **Plan parsing (cold path).** Drivers declare `planFormat`. `plan-parser.ts`
   selects the parser by descriptor instead of always assuming Postgres. (Cold
   enough that async IPC to a driver `parsePlan(rows)` capability is also viable;
   descriptor-selected parser is preferred to keep the plan view synchronous.)

4. **SQL DDL/destructive classification.** These regexes are *generic SQL*, not
   per-dialect, so they can stay as a shared renderer util — unless a driver
   needs to override, in which case `sqlClassification` lets it. Lowest priority.

5. **Sample-query fallback.** Drivers already expose `sampleQuery` via
   `DB_SAMPLE_QUERY`. Delete the renderer's hardcoded `SELECT * … LIMIT 100`
   fallback and rely on the driver (it's required for SQL drivers). Trivial.

## Delivery & boot flow

`ctx.drivers.register({ …, statements, errorPatterns, planFormat })` → the
orchestrator includes these in the serialized `DriverCapabilities` →
`useDriverCapabilitiesStore.fetch(type)` caches them in the renderer → the
generic interpreters read from the cache keyed by the active connection's type.
No new IPC; no per-keystroke round-trip.

## Migration order (safest first)

1. `sampleQuery` fallback removal (trivial, no descriptor needed).
2. Statement splitting (has generic impls already; highest-value violation).
3. Error patterns.
4. Plan format.
5. (Optional) SQL classification override.

Each step is independently shippable and leaves the app working.

## Non-goals

- Rewriting the editor or moving hot paths to async IPC (rejected — latency).
- The AI prompt-context assembly in `stores/ai.ts` (a separate, lighter concern
  — that data inherently lives in renderer stores; only the string formatting is
  debatable and is out of scope here).
- A general plugin→renderer code-execution channel (descriptors are data, by
  design — no plugin code runs in the renderer).

## Testing

- Schema validation for each descriptor (regex compiles, splitter id known).
- Generic interpreters given descriptors (split/classify/parse) — table-driven.
- Snapshot each bundled driver's descriptors so a dialect regression is visible.
- ReDoS guard on `errorPatterns` (bounded match time).

## Risks

- **Regex serialization / ReDoS:** patterns cross the IPC boundary as strings;
  validate and bound them.
- **Descriptor expressiveness:** a dialect with genuinely unusual statement
  boundaries (e.g. PL/pgSQL `$$` bodies) may need a richer splitter descriptor
  than `sql|lines|braces`; design the `statements` shape with room to grow.
- **Versioning:** capabilities are cached; bump/clear the cache when the
  descriptor schema changes.
