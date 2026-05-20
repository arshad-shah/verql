# Extensible CodeLens — Per-DB Statement Splitting & Actions

**Date:** 2026-05-20
**Status:** Approved (clean break — no deprecated code paths retained)

## Problem

The current Monaco CodeLens (`src/renderer/src/lib/monaco-codelens.ts`) is hardcoded SQL:

1. A single splitter (`splitStatements`) walks the source looking for top-level `;`. This misses statement boundaries when the user separates queries by newline alone (the common case the bug report names: two queries in one tab → only one set of `▶ Run / Explain` buttons appears).
2. Even when two statements are detected, both lenses anchor at `{ startLineNumber: s.startLine, startColumn: 1, endLineNumber: s.startLine, endColumn: 1 }`. If two statements share a start line (e.g. `SELECT 1; SELECT 2` on one line), Monaco collapses the overlapping zero-width ranges and only one lens stack renders.
3. The lens actions (`Run`, `Explain`) and their handlers live in the editor library, dispatched via `window` events to `QueryPanel`. New DB types (Mongo, Redis, Snowflake, future plugins) can't contribute their own actions or grammar without editing core editor code.

## Goals

- Each DB type owns its own statement segmentation rules and its own lens action set.
- New plugins can contribute statement splitters + lens actions with no edits to the editor library.
- Two newline-separated SQL statements (with or without a trailing `;`) each get their own lens stack.
- Two statements on the same line each get their own visible lens stack.
- Clean break: the `window.dispatchEvent('nova:run-statement' | 'nova:explain-statement')` indirection and the hardcoded SQL splitter are deleted, not deprecated.

## Non-goals

- Building an in-editor SQL parser. The SQL splitter remains lexer-level (strings/comments/quotes) plus a keyword heuristic — not a full grammar.
- Cross-process plugin sandboxing for splitters. Renderer-side contribution matches how `completion-registry` already works.
- Plugin-contributed lenses for non-statement concerns (e.g. inline references). Out of scope.

## Architecture

### Registry (new)

`src/renderer/src/lib/statement-registry.ts` — renderer-side, keyed by db type. Mirrors `completion-registry`.

```ts
export interface Statement {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  text: string
}

export interface LensActionContext {
  stmt: Statement
  tabId: string
  connectionId: string | null
  dbType: string
}

export interface LensAction {
  id: string                              // 'run', 'explain', plugin-specific ids
  title: string                           // display label, e.g. '▶ Run'
  when?: (stmt: Statement) => boolean     // optional; omit = always shown
  handler: (ctx: LensActionContext) => void
}

export interface StatementContribution {
  splitStatements(source: string): Statement[]
  lensActions: LensAction[]
}

export function registerStatementContribution(dbType: string, c: StatementContribution): void
export function getStatementContribution(dbType: string): StatementContribution | undefined
export function invokeLensAction(dbType: string, actionId: string, ctx: LensActionContext): void
```

- One contribution per `dbType`. Re-registration replaces (covers HMR).
- `invokeLensAction` looks up the contribution and the action by id, then calls the handler. Silent no-op if either is missing (defensive, but expected to be unreachable).

### Bundled SQL contribution (new)

`src/renderer/src/lib/statement-contributions/sql.ts` — registered at renderer boot for `postgresql`, `mysql`, `sqlite`.

Splitter rules:

1. Lexer skips: single-quote, double-quote, backtick strings (with `\<delim>` escape), line comments (`--…\n`), block comments (`/* … */`).
2. A top-level `;` ends a statement.
3. A top-level newline followed (after whitespace) by a statement-introducing keyword opens a new statement even without `;`. Keyword set: `SELECT | INSERT | UPDATE | DELETE | WITH | CREATE | ALTER | DROP | TRUNCATE | EXPLAIN | BEGIN | COMMIT | ROLLBACK | GRANT | REVOKE | SHOW | USE | VACUUM | ANALYZE | SET`.
4. Trailing buffer (no terminator) flushes as the final statement.
5. Empty/whitespace-only segments are dropped.

Each emitted `Statement` carries the **full** range (start line+col → end line+col of the last non-whitespace token), so two statements on one line get distinct lens anchors.

Lens actions:

- `run` — title `▶ Run` — handler calls `tabActions.runStatement(tabId, stmt.text)`.
- `explain` — title `Explain` — handler calls `tabActions.explainStatement(tabId, stmt.text)`.

`tabActions.runStatement` / `explainStatement` are extracted out of the current `QueryPanel` window-event listeners (see Migration below).

### Bundled non-SQL contributions

- **MongoDB** (`mongodb` dbType): splitter parses top-level brace-balanced JSON documents / shell commands separated by `\n`. Lens actions: `run` (label `▶ Run`). No `explain`. Lives in `src/main/plugins/bundled/mongodb/` adjacent code paths — registered via a renderer-side entrypoint exported from the plugin's contribution bundle.
- **Redis**: splitter = one command per non-empty line (comments stripped: `#…`). Lens actions: `run` only.
- **Snowflake**: shares the SQL contribution (registered for `snowflake` dbType pointing at the same impl).

Each non-SQL plugin's renderer contribution is loaded at app boot from a single `registerBuiltinStatementContributions()` call (kept alongside `completion-registry` setup). No deferred/IPC loading; contributions are pure functions.

### Monaco provider (rewrite)

`src/renderer/src/lib/monaco-codelens.ts` is rewritten end-to-end:

- Exports two functions: `installCodeLensCommand(monaco)` (registers a single Monaco command `nova.invokeLensAction`) and `registerCodeLensProviderForLanguage(monaco, language)` (registers a provider against the language used by Nova editors — `sql`, `json`, `plaintext`).
- The provider's `provideCodeLenses(model)`:
  1. Resolves the active tab and `dbType` for this model via `editorRegistry` (look up by model URI; the registry already keys editors by tabId, extend it to expose model→tab lookup).
  2. Looks up the contribution. If none, return `{ lenses: [], dispose: () => {} }`.
  3. Calls `splitStatements(model.getValue())`.
  4. For each statement × each lens action whose `when?(stmt)` passes, emits one `CodeLens` whose `range` is the statement's full range and whose `command` is `{ id: 'nova.invokeLensAction', title: action.title, arguments: [dbType, action.id, tabId, connectionId, stmt] }`.
  5. Lens `id` = `${actionId}-${startLine}-${startColumn}` (uniqueness for same-line cases).
- The `nova.invokeLensAction` command handler unpacks args and calls `invokeLensAction(dbType, actionId, { stmt, tabId, connectionId, dbType })`.

### Migration (clean break — to be deleted, not deprecated)

- Delete `splitStatements`, `RUN_COMMAND_ID`, `EXPLAIN_COMMAND_ID`, `SqlCodeLensEvents`, and the per-language `registeredLangs` gate in `monaco-codelens.ts`.
- Delete the `window.addEventListener('nova:run-statement' | 'nova:explain-statement', …)` handlers in `QueryPanel.tsx`. Their bodies move into `tabActions.runStatement(tabId, sql)` / `tabActions.explainStatement(tabId, sql)`, which the SQL contribution's handlers call directly.
- `QueryEditor.tsx`: replace the `language === 'sql'` gate calling `installSqlCodeLensCommandHandlers` + `registerSqlCodeLens` with unconditional `installCodeLensCommand(monaco)` + `registerCodeLensProviderForLanguage(monaco, language)`. The provider itself handles the "no contribution for this dbType" case.

### Editor registry extension

`editorRegistry` currently keys by `tabId`. Add a `getByModelUri(uri: string)` lookup so the lens provider can resolve `{ tabId, dbType, connectionId }` from the model Monaco hands it. `dbType` and `connectionId` are pulled from `useTabsStore` / `useConnectionsStore` at lookup time (not cached on the registry entry — connection can change).

## Data flow (lens invocation)

```
User clicks "▶ Run" lens
  → Monaco fires command 'nova.invokeLensAction' with [dbType, actionId, tabId, connectionId, stmt]
  → command handler calls invokeLensAction(dbType, actionId, ctx)
  → registry resolves contribution[dbType].lensActions.find(a => a.id === actionId).handler(ctx)
  → handler calls tabActions.runStatement(tabId, stmt.text)
  → runStatement reuses existing QueryPanel run path (db:switch-database / set-schema / db:query, error parsing, destructive confirm)
```

## Error handling

- Contribution registration: last write wins; no error thrown on re-register (HMR).
- Splitter throws: provider catches, logs once per tab+message via `console.warn`, returns no lenses for that pass. Subsequent edits retry.
- Action handler throws: caught at the command boundary, surfaced via `useToastStore.error`. The lens itself remains clickable.
- Missing contribution for dbType: silent (no lenses). Expected for unconnected tabs.

## Testing

Unit tests in `tests/unit/`:

- `statement-splitter-sql.test.ts`
  - Multi-statement, all with `;`.
  - Multi-statement, newline-separated, no `;`.
  - Mixed: some `;`, some newline-only.
  - Two statements on one line.
  - `;` inside string literal / line comment / block comment.
  - Keywords inside strings/comments don't trigger boundaries.
  - Trailing whitespace, leading whitespace.
  - Empty source, only comments.
- `statement-registry.test.ts`
  - Register / lookup / replace.
  - `invokeLensAction` calls the right handler.
  - Missing dbType / missing actionId are no-ops.
- `statement-splitter-redis.test.ts`, `statement-splitter-mongo.test.ts` — happy path + comments + empty lines.

Storybook:

- Extend `QueryEditor.stories.tsx` with a story containing 3 SQL statements (one with `;`, one newline-only, one with same-line companion) and a visual assertion that 3 distinct lens stacks render.

## Acceptance criteria

- Two SQL statements separated only by a newline each show their own `▶ Run / Explain` lens.
- Two SQL statements on the same line each show their own lens.
- Switching a tab's connection from Postgres to MongoDB swaps the lens action set without an editor remount.
- Removing the SQL plugin (hypothetical) leaves the editor functional with zero lenses for SQL tabs.
- Grep confirms no remaining references to `nova:run-statement`, `nova:explain-statement`, `installSqlCodeLensCommandHandlers`, or `registerSqlCodeLens` in the codebase.

## Files touched

**New:**
- `src/renderer/src/lib/statement-registry.ts`
- `src/renderer/src/lib/statement-contributions/sql.ts`
- `src/renderer/src/lib/statement-contributions/mongodb.ts`
- `src/renderer/src/lib/statement-contributions/redis.ts`
- `src/renderer/src/lib/statement-contributions/index.ts` (boot-time registration entrypoint)
- `tests/unit/statement-splitter-sql.test.ts`
- `tests/unit/statement-splitter-redis.test.ts`
- `tests/unit/statement-splitter-mongo.test.ts`
- `tests/unit/statement-registry.test.ts`

**Rewritten:**
- `src/renderer/src/lib/monaco-codelens.ts`

**Modified:**
- `src/renderer/src/components/query/QueryEditor.tsx` — call new install/register functions unconditionally.
- `src/renderer/src/components/query/QueryPanel.tsx` — remove window-event listeners; extract run/explain bodies into `tabActions`.
- `src/renderer/src/stores/tab-actions.ts` — add `runStatement(tabId, sql)`, `explainStatement(tabId, sql)`.
- `src/renderer/src/stores/editor.ts` — add `getByModelUri` lookup.
- `src/renderer/src/App.tsx` (or boot file) — call `registerBuiltinStatementContributions()` once at startup.
- `src/renderer/src/components/query/QueryEditor.stories.tsx` — multi-statement story.

**Deleted (clean break — code removed, not deprecated):**
- All `nova:run-statement` / `nova:explain-statement` references.
- `RUN_COMMAND_ID`, `EXPLAIN_COMMAND_ID`, `SqlCodeLensEvents`, `installSqlCodeLensCommandHandlers`, `registerSqlCodeLens`, hardcoded `splitStatements` in `monaco-codelens.ts`.
