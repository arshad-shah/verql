# Editor AI Surfaces Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Verql's three editor AI surfaces — inline ghost-text, per-statement Run/Explain actions, and the results Explain card — under one anchored-toolbar visual language. Lucide icons only (no ASCII glyphs). Built from design-system primitives. Consistent with the existing AI chat.

**Architecture:** Renderer-only UI plus a one-line return-type extension and streaming-channel addition in the bundled AI plugin. Statement actions move from Monaco CodeLens (text-only titles) to Monaco overlay widgets so we can render lucide icons. Inline ghost-text keeps the existing IPC provider and adds three overlay widgets (status pill, Accept/Reject toolbar, model picker) around it. The Explain card renders markdown, supports streaming + cancel, and routes "Ask follow-up" into the existing AI chat panel.

**Tech Stack:** React 19, Zustand, Monaco (`monaco-editor` + `@monaco-editor/react`), lucide-react, Tailwind + CVA primitives (`Button`, `Kbd`, `Tooltip`, `Menu`, `Text`), Vitest, Storybook.

**Spec:** `docs/superpowers/specs/2026-05-28-editor-ai-surfaces-redesign-design.md`.

**Implementation order** (per spec risk mitigation): Section 2 (statement gutter, Tasks 1-5) → Section 1 (inline ghost, Tasks 6-8) → Section 3 (explain card, Tasks 9-13) → polish (Tasks 14-15). Each section is independently shippable.

---

## File map

**New files:**
- `src/renderer/src/stores/statement-status.ts` — per-tab last-run cache keyed by statement hash.
- `src/renderer/src/components/query/StatementGutter.tsx` — Monaco view-zone + content-widget renderer for `LensAction`s.
- `src/renderer/src/hooks/useAIInlineSuggest.ts` — owns the three inline-ghost overlay widgets.
- `src/renderer/src/components/query/StatementGutter.stories.tsx` — Storybook coverage.
- `src/renderer/src/components/ai/ExplainCard.stories.tsx` — Storybook coverage.
- `tests/unit/statement-status.test.ts` — store unit tests.
- `tests/unit/statement-hash.test.ts` — hash determinism + collision-domain tests.

**Modified files:**
- `src/renderer/src/lib/statement-registry.ts` — add `icon?: LucideIcon` to `LensAction`.
- `src/renderer/src/lib/statement-contributions/sql.ts` — drop the `▶` glyph; supply lucide icons.
- `src/renderer/src/lib/monaco-ai-completion.ts` — refactor module state into a per-editor signal exposed to the hook.
- `src/renderer/src/components/query/QueryEditor.tsx` — mount `StatementGutter` + `useAIInlineSuggest`; register `Cmd+\` trigger; remove `installCodeLensCommand` + `registerCodeLensProviderForLanguage` calls.
- `src/renderer/src/stores/tab-actions.ts` — let `runStatement`/`explainStatement` record into `statement-status`.
- `src/renderer/src/stores/explain.ts` — extend with `model`, `durationMs`, `streamingText`, `streamId`.
- `src/renderer/src/components/ai/ExplainPanel.tsx` — rebuild `ExplainResult` as a markdown card with action bar + streaming.
- `shared/ipc.ts` — extend `ai:explain-results` return type; add `ai:explain:start`, `ai:explain:abort`, and `ai:explain:event` channels.
- `src/main/plugins/bundled/ai/internal/enhancements.ts` — `explainResults` returns `{ explanation, model, durationMs }`; update system prompt to permit concise markdown.
- `src/main/plugins/bundled/ai/internal/index.ts` — register the three new streaming channels.
- `docs/architecture.md` — note the swap from CodeLens to overlay widgets.
- `docs/ai.md` — document the streaming explain channel.
- `.changeset/editor-ai-surfaces.md` — new changeset (minor).

**Deleted files:**
- `src/renderer/src/lib/monaco-codelens.ts` (after Task 5).

---

## Section 2 — Statement gutter (Run / Explain)

### Task 1: Add `icon` field to `LensAction` and wire the SQL contribution

**Files:**
- Modify: `src/renderer/src/lib/statement-registry.ts`
- Modify: `src/renderer/src/lib/statement-contributions/sql.ts`

- [ ] **Step 1: Extend the `LensAction` type with an optional `icon` field**

In `src/renderer/src/lib/statement-registry.ts`, at the top of the file add the import and update the interface:

```ts
import type { LucideIcon } from 'lucide-react'

// ...

export interface LensAction {
  id: string
  title: string
  /** Optional lucide icon component rendered to the left of the title. */
  icon?: LucideIcon
  when?: (stmt: Statement) => boolean
  handler: (ctx: LensActionContext) => void
}
```

- [ ] **Step 2: Update the SQL contribution to supply icons and drop the `▶` glyph**

Replace the `lensActions` array at the bottom of `src/renderer/src/lib/statement-contributions/sql.ts`:

```ts
import { Play, Sparkles } from 'lucide-react'
// ... existing imports

export const sqlStatementContribution: StatementContribution = {
  splitStatements: splitSqlStatements,
  lensActions: [
    { id: 'run',     title: 'Run',     icon: Play,     handler: (ctx) => tabActions.runStatement(ctx.tabId, ctx.stmt.text) },
    { id: 'explain', title: 'Explain', icon: Sparkles, handler: (ctx) => tabActions.explainStatement(ctx.tabId, ctx.stmt.text) },
  ],
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS — no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/lib/statement-registry.ts src/renderer/src/lib/statement-contributions/sql.ts
git commit -m "feat(editor): add icon field to LensAction; drop ▶ glyph from sql contribution"
```

---

### Task 2: Create `statement-status` store + tests

**Files:**
- Create: `src/renderer/src/stores/statement-status.ts`
- Create: `tests/unit/statement-status.test.ts`
- Create: `tests/unit/statement-hash.test.ts`

- [ ] **Step 1: Write the failing hash test**

Create `tests/unit/statement-hash.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { hashStatement } from '@/stores/statement-status'

describe('hashStatement', () => {
  it('is stable for identical input', () => {
    expect(hashStatement('SELECT 1')).toEqual(hashStatement('SELECT 1'))
  })

  it('ignores leading/trailing whitespace and outer-case', () => {
    expect(hashStatement('  SELECT 1  ')).toEqual(hashStatement('select 1'))
  })

  it('differs across distinct statements', () => {
    expect(hashStatement('SELECT 1')).not.toEqual(hashStatement('SELECT 2'))
  })
})
```

- [ ] **Step 2: Write the failing store test**

Create `tests/unit/statement-status.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStatementStatus, hashStatement } from '@/stores/statement-status'

describe('statement-status store', () => {
  beforeEach(() => {
    useStatementStatus.setState({ byKey: {} })
  })

  it('records and retrieves a status', () => {
    const tabId = 't1'
    const hash = hashStatement('SELECT 1')
    useStatementStatus.getState().record(tabId, hash, {
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
    expect(useStatementStatus.getState().get(tabId, hash)).toEqual({
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
  })

  it('returns undefined for unseen statement', () => {
    expect(useStatementStatus.getState().get('t1', 'unknown')).toBeUndefined()
  })

  it('clears entries for a tab', () => {
    const tabId = 't1'
    const hash = hashStatement('SELECT 1')
    useStatementStatus.getState().record(tabId, hash, {
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
    useStatementStatus.getState().clearTab(tabId)
    expect(useStatementStatus.getState().get(tabId, hash)).toBeUndefined()
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test -- --run tests/unit/statement-status.test.ts tests/unit/statement-hash.test.ts`
Expected: FAIL — module `@/stores/statement-status` not found.

- [ ] **Step 4: Implement the store**

Create `src/renderer/src/stores/statement-status.ts`:

```ts
import { create } from 'zustand'

export interface StatementStatus {
  kind: 'ok' | 'error' | 'running'
  /** Wall-clock duration in milliseconds. `null` while running. */
  durationMs: number | null
  /** Row count for `ok`; null otherwise. */
  rowCount: number | null
  /** `Date.now()` at the moment the status was recorded. */
  ranAt: number
}

interface State {
  /** Keyed by `${tabId}::${stmtHash}`. */
  byKey: Record<string, StatementStatus>
  record(tabId: string, stmtHash: string, status: StatementStatus): void
  get(tabId: string, stmtHash: string): StatementStatus | undefined
  clearTab(tabId: string): void
}

const key = (tabId: string, hash: string) => `${tabId}::${hash}`

export const useStatementStatus = create<State>((set, get) => ({
  byKey: {},
  record(tabId, stmtHash, status) {
    set((s) => ({ byKey: { ...s.byKey, [key(tabId, stmtHash)]: status } }))
  },
  get(tabId, stmtHash) {
    return get().byKey[key(tabId, stmtHash)]
  },
  clearTab(tabId) {
    set((s) => {
      const next: Record<string, StatementStatus> = {}
      for (const k of Object.keys(s.byKey)) {
        if (!k.startsWith(`${tabId}::`)) next[k] = s.byKey[k]
      }
      return { byKey: next }
    })
  },
}))

/**
 * Stable 32-bit FNV-1a hash of a SQL statement. Trims surrounding whitespace
 * and lowercases so trivial edits (e.g., reformatting) don't invalidate the
 * status. Returns an 8-char hex string.
 */
export function hashStatement(sql: string): string {
  const s = sql.trim().toLowerCase()
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- --run tests/unit/statement-status.test.ts tests/unit/statement-hash.test.ts`
Expected: PASS — all 6 cases green.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/stores/statement-status.ts tests/unit/statement-status.test.ts tests/unit/statement-hash.test.ts
git commit -m "feat(editor): statement-status store + FNV-1a hash"
```

---

### Task 3: Record statement status from `tab-actions.runStatement`

**Files:**
- Modify: `src/renderer/src/stores/tab-actions.ts`

Note: the `runStatement` action defined in `tab-actions.ts` is a thin dispatch to the tab's handler. The actual query execution lives in `components/query/QueryPanel.tsx` (`onExecute`). We record `running` at the dispatch site and the terminal status from the query panel.

- [ ] **Step 1: Add a `recordStatementStatus` helper on `tabActions`**

In `src/renderer/src/stores/tab-actions.ts`, add inside the `tabActions` object (next to `runStatement`):

```ts
import { useStatementStatus, hashStatement, type StatementStatus } from '@/stores/statement-status'

// ... existing tabActions object — add these methods:

  recordRunStart(tabId: string, sql: string): void {
    const h = hashStatement(sql)
    useStatementStatus.getState().record(tabId, h, {
      kind: 'running', durationMs: null, rowCount: null, ranAt: Date.now(),
    })
  },
  recordRunResult(tabId: string, sql: string, outcome: Omit<StatementStatus, 'ranAt'>): void {
    const h = hashStatement(sql)
    useStatementStatus.getState().record(tabId, h, { ...outcome, ranAt: Date.now() })
  },
```

- [ ] **Step 2: Update `runStatement` to mark `running` automatically**

Replace the existing `runStatement` method body in `tab-actions.ts`:

```ts
  runStatement(tabId: string, sql: string): void {
    this.recordRunStart(tabId, sql)
    handlers.get(tabId)?.runStatement?.(sql)
  },
```

(The terminal status — `ok`/`error` with `durationMs`/`rowCount` — is recorded from the tab handler in Task 4 wiring.)

- [ ] **Step 3: Update the JSDoc comment that references the old `"▶ Run"` label**

Replace the existing JSDoc on `runStatement` (line ~27 in `tab-actions.ts`):

```ts
  /** Run a single SQL statement (statement-gutter Run action). */
  runStatement?: (sql: string) => void
```

And similarly drop the `"▶ Run"` reference in the JSDoc for `explainStatement`.

- [ ] **Step 4: Wire the result side in QueryPanel**

Open `src/renderer/src/components/query/QueryPanel.tsx`. Find the spot where `runStatement` (or its handler-side equivalent) returns a `QueryResult` or throws. Around the call, add:

```ts
import { tabActions } from '@/stores/tab-actions'
// ...
const startedAt = performance.now()
try {
  const result = await /* existing execution call */
  tabActions.recordRunResult(tab.id, sqlBeingRun, {
    kind: 'ok',
    durationMs: Math.round(performance.now() - startedAt),
    rowCount: result.rowCount ?? null,
  })
  return result
} catch (err) {
  tabActions.recordRunResult(tab.id, sqlBeingRun, {
    kind: 'error',
    durationMs: Math.round(performance.now() - startedAt),
    rowCount: null,
  })
  throw err
}
```

Apply this only to the **single-statement** runner that gets invoked from the gutter (look for the comment referencing CodeLens `override`). Multi-statement runs from `Cmd+Enter` should not record per-statement status — they don't have a single hash.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/stores/tab-actions.ts src/renderer/src/components/query/QueryPanel.tsx
git commit -m "feat(editor): record per-statement run status into statement-status store"
```

---

### Task 4: Build `StatementGutter` component

**Files:**
- Create: `src/renderer/src/components/query/StatementGutter.tsx`

- [ ] **Step 1: Scaffold the component**

Create `src/renderer/src/components/query/StatementGutter.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { editor } from 'monaco-editor'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/primitives/forms/Button'
import { Text } from '@/primitives/typography/Text'
import {
  getStatementContribution,
  type LensAction,
  type Statement,
  type LensActionContext,
} from '@/lib/statement-registry'
import { useStatementStatus, hashStatement, type StatementStatus } from '@/stores/statement-status'
import { useConnectionsStore } from '@/stores/connections'

interface Props {
  editor: editor.IStandaloneCodeEditor
  tabId: string
  connectionId: string | null
  dbType: string | undefined
}

interface ZoneEntry {
  zoneId: string
  widgetId: string
  containerEl: HTMLDivElement
  stmt: Statement
}

export function StatementGutter({ editor, tabId, connectionId, dbType }: Props) {
  const entriesRef = useRef<ZoneEntry[]>([])
  // Re-render trigger for portal contents when statements/status change.
  const [, setTick] = useRefTick()

  useEffect(() => {
    if (!dbType) return
    const contribution = getStatementContribution(dbType)
    if (!contribution) return

    const reconcile = () => {
      const model = editor.getModel()
      if (!model) return
      let stmts: Statement[] = []
      try {
        stmts = contribution.splitStatements(model.getValue())
      } catch (err) {
        console.warn('[statement-gutter] splitter threw:', err)
      }

      editor.changeViewZones((accessor) => {
        for (const e of entriesRef.current) {
          accessor.removeZone(e.zoneId)
          editor.removeContentWidget({ getId: () => e.widgetId, getDomNode: () => e.containerEl, getPosition: () => null })
        }
        entriesRef.current = []

        for (const stmt of stmts) {
          const containerEl = document.createElement('div')
          containerEl.className = 'verql-stmt-gutter flex items-center gap-1 px-2 h-[24px] text-xs'
          const widgetId = `verql.stmt-widget.${stmt.startLine}.${stmt.startColumn}`
          const domNode = document.createElement('div')
          domNode.style.width = '100%'
          domNode.appendChild(containerEl)

          const zoneId = accessor.addZone({
            afterLineNumber: Math.max(0, stmt.startLine - 1),
            heightInLines: 1,
            domNode,
          })

          editor.addContentWidget({
            getId: () => widgetId,
            getDomNode: () => containerEl,
            getPosition: () => null,
          })

          entriesRef.current.push({ zoneId, widgetId, containerEl, stmt })
        }
      })

      setTick()
    }

    reconcile()
    const sub = editor.onDidChangeModelContent(() => {
      // Debounce inside Monaco's microtask queue.
      window.clearTimeout((reconcile as { _t?: number })._t)
      ;(reconcile as { _t?: number })._t = window.setTimeout(reconcile, 100) as unknown as number
    })

    return () => {
      sub.dispose()
      editor.changeViewZones((accessor) => {
        for (const e of entriesRef.current) {
          accessor.removeZone(e.zoneId)
          editor.removeContentWidget({ getId: () => e.widgetId, getDomNode: () => e.containerEl, getPosition: () => null })
        }
        entriesRef.current = []
      })
    }
  }, [editor, dbType, setTick])

  if (!dbType) return null
  const contribution = getStatementContribution(dbType)
  if (!contribution) return null

  return (
    <>
      {entriesRef.current.map((entry) =>
        createPortal(
          <GutterRow
            key={entry.widgetId}
            stmt={entry.stmt}
            actions={contribution.lensActions}
            tabId={tabId}
            connectionId={connectionId}
            dbType={dbType}
          />,
          entry.containerEl
        )
      )}
    </>
  )
}

function GutterRow({
  stmt, actions, tabId, connectionId, dbType,
}: {
  stmt: Statement
  actions: LensAction[]
  tabId: string
  connectionId: string | null
  dbType: string
}) {
  const status = useStatementStatus((s) => s.get(tabId, hashStatement(stmt.text)))
  const ctx: LensActionContext = { stmt, tabId, connectionId, dbType }

  return (
    <>
      {actions
        .filter((a) => !a.when || a.when(stmt))
        .map((a) => (
          <Button
            key={a.id}
            variant="ghost"
            size="xs"
            onClick={() => a.handler(ctx)}
            className="!h-6 !px-1.5 gap-1 text-text-secondary hover:text-text-primary"
          >
            {a.icon ? <a.icon size={12} /> : null}
            {a.title}
          </Button>
        ))}
      {status ? <StatusChip status={status} /> : null}
    </>
  )
}

function StatusChip({ status }: { status: StatementStatus }) {
  if (status.kind === 'running') {
    return (
      <Text as="span" size="xs" color="muted" className="ml-2 inline-flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" />
        running
      </Text>
    )
  }
  if (status.kind === 'error') {
    return (
      <Text as="span" size="xs" color="error" className="ml-2 inline-flex items-center gap-1">
        <AlertCircle size={10} />
        failed
        {status.durationMs != null ? ` · ${formatMs(status.durationMs)}` : null}
      </Text>
    )
  }
  return (
    <Text as="span" size="xs" color="success" className="ml-2 inline-flex items-center gap-1">
      <Check size={10} />
      {status.durationMs != null ? formatMs(status.durationMs) : 'ok'}
      {status.rowCount != null ? ` · ${status.rowCount} row${status.rowCount === 1 ? '' : 's'}` : null}
    </Text>
  )
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// useRefTick: forces a re-render of the parent for portal targets.
function useRefTick(): [number, () => void] {
  const [n, setN] = require('react').useState(0)
  return [n, () => setN((x: number) => x + 1)]
}
```

Note: the `useRefTick` helper above uses `require('react')` to keep the import list short — replace with a regular `useState` import at the top if your linter prefers.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit (no mount yet — wired in next task)**

```bash
git add src/renderer/src/components/query/StatementGutter.tsx
git commit -m "feat(editor): StatementGutter component (view zones + lucide-icon actions)"
```

---

### Task 5: Mount `StatementGutter` in QueryEditor; delete `monaco-codelens.ts`

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`
- Delete: `src/renderer/src/lib/monaco-codelens.ts`

- [ ] **Step 1: Remove the CodeLens mount calls**

In `src/renderer/src/components/query/QueryEditor.tsx`:

1. Remove the import line: `import { installCodeLensCommand, registerCodeLensProviderForLanguage } from '@/lib/monaco-codelens'`.
2. Remove the two calls inside `handleMount` (`installCodeLensCommand(monaco)` and `registerCodeLensProviderForLanguage(monaco, language)`).
3. Update the comment block that references CodeLens (around line 209) — replace `"▶ Run / Explain" CodeLens` with `"Run / Explain" statement-gutter overlay`.

- [ ] **Step 2: Render `StatementGutter` alongside the editor**

Still in `QueryEditor.tsx`, add the import:

```tsx
import { StatementGutter } from './StatementGutter'
```

Change the JSX return so the editor is wrapped:

```tsx
return (
  <>
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme={getMonacoThemeName(theme)}
      options={options}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      loading={
        <Flex align="center" justify="center" className="h-full">
          <Text size="sm" color="muted">Loading editor...</Text>
        </Flex>
      }
    />
    {editorInstance ? (
      <StatementGutter
        editor={editorInstance}
        tabId={tabId}
        connectionId={connectionId}
        dbType={databaseType}
      />
    ) : null}
  </>
)
```

- [ ] **Step 3: Delete the obsolete CodeLens file**

```bash
git rm src/renderer/src/lib/monaco-codelens.ts
```

- [ ] **Step 4: Typecheck + smoke-test in dev**

Run: `pnpm exec tsc -b --noEmit` → PASS.
Run: `pnpm dev`, open a SQL tab, type two statements, verify:
- A row appears above each statement with **Run** and **Explain** buttons rendered as lucide icons + text — no `▶` glyph anywhere.
- Clicking **Run** executes the statement and a status chip appears (e.g., `0.2s · 42 rows`).
- Editing the statement causes the chip to disappear (hash changed).
- No CodeLens artifacts in the DOM (grep dev tools for `.codelens-decoration` — none should be present in the editor for SQL tabs).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx
git commit -m "feat(editor): swap Monaco CodeLens for StatementGutter overlay; drop ▶ glyph"
```

---

## Section 1 — Inline AI ghost-text

### Task 6: Refactor `monaco-ai-completion.ts` to expose pending state

**Files:**
- Modify: `src/renderer/src/lib/monaco-ai-completion.ts`

- [ ] **Step 1: Replace the module-level signal with a pub-sub**

Rewrite `src/renderer/src/lib/monaco-ai-completion.ts`:

```ts
import type { Monaco } from '@monaco-editor/react'
import type { editor, Position, CancellationToken, languages } from 'monaco-editor'
import { IPC_CHANNELS } from '@shared/ipc'

export type InlineAIState = 'idle' | 'thinking' | 'ready'

type Listener = (s: InlineAIState) => void

let currentConnectionId: string | null = null
let state: InlineAIState = 'idle'
const listeners = new Set<Listener>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function setState(next: InlineAIState): void {
  if (state === next) return
  state = next
  for (const l of listeners) l(state)
}

export function getInlineAIState(): InlineAIState {
  return state
}

export function subscribeInlineAIState(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function setAICompletionContext(connectionId: string | null): void {
  currentConnectionId = connectionId
}

export function registerAIInlineCompletionProvider(monaco: Monaco, language: string): void {
  monaco.languages.registerInlineCompletionsProvider(language, {
    provideInlineCompletions: async (
      model: editor.ITextModel,
      position: Position,
      _context: languages.InlineCompletionContext,
      token: CancellationToken
    ) => {
      if (!currentConnectionId) return { items: [] }
      if (debounceTimer) clearTimeout(debounceTimer)

      return new Promise((resolve) => {
        debounceTimer = setTimeout(async () => {
          if (token.isCancellationRequested) { resolve({ items: [] }); return }
          const fullText = model.getValue()
          if (fullText.trim().length < 3) { resolve({ items: [] }); return }

          setState('thinking')
          try {
            const result = await window.electronAPI.invoke(IPC_CHANNELS.AI_COMPLETE_SQL, {
              sql: fullText,
              cursorOffset: model.getOffsetAt(position),
              connectionId: currentConnectionId!,
            }) as { completion: string }

            if (token.isCancellationRequested || !result.completion) {
              setState('idle'); resolve({ items: [] }); return
            }
            setState('ready')
            resolve({
              items: [{
                insertText: result.completion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            })
          } catch {
            setState('idle')
            resolve({ items: [] })
          }
        }, 300)
      })
    },
    freeInlineCompletions: () => { setState('idle') },
    disposeInlineCompletions: () => { setState('idle') },
  } as Parameters<typeof monaco.languages.registerInlineCompletionsProvider>[1])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/lib/monaco-ai-completion.ts
git commit -m "refactor(editor): expose inline-AI pending state via pub-sub"
```

---

### Task 7: Build `useAIInlineSuggest` hook (status pill + Accept/Reject toolbar)

**Files:**
- Create: `src/renderer/src/hooks/useAIInlineSuggest.ts`

- [ ] **Step 1: Implement the hook**

Create `src/renderer/src/hooks/useAIInlineSuggest.ts`:

```tsx
import { useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { editor } from 'monaco-editor'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/primitives/forms/Button'
import { Kbd } from '@/primitives/typography/Kbd'
import { Text } from '@/primitives/typography/Text'
import { useAIStore } from '@/stores/ai'
import { subscribeInlineAIState, getInlineAIState, type InlineAIState } from '@/lib/monaco-ai-completion'

/**
 * Mounts two Monaco overlay widgets:
 *   1. A status pill (bottom-right of the editor viewport) reflecting the
 *      inline-completion state machine: idle → thinking → ready → idle.
 *   2. An Accept/Reject toolbar anchored to the cursor line whenever the
 *      provider has a suggestion ready.
 *
 * Both widgets render React content into DOM nodes owned by Monaco; the
 * hook tears them down on unmount.
 */
export function useAIInlineSuggest(ed: editor.IStandaloneCodeEditor | null): void {
  useEffect(() => {
    if (!ed) return

    const pillNode = document.createElement('div')
    const toolbarNode = document.createElement('div')
    const pillRoot = createRoot(pillNode)
    const toolbarRoot = createRoot(toolbarNode)

    const pillWidget: editor.IOverlayWidget = {
      getId: () => 'verql.inline-ai.pill',
      getDomNode: () => pillNode,
      getPosition: () => ({ preference: 1 /* BOTTOM_RIGHT_CORNER */ }),
    }
    const toolbarWidget: editor.IContentWidget = {
      getId: () => 'verql.inline-ai.toolbar',
      getDomNode: () => toolbarNode,
      getPosition: () => {
        const pos = ed.getPosition()
        if (!pos) return null
        return { position: pos, preference: [2 /* BELOW */, 1 /* ABOVE */] }
      },
    }

    ed.addOverlayWidget(pillWidget)
    ed.addContentWidget(toolbarWidget)

    const render = (state: InlineAIState) => {
      const model = useAIStore.getState().activeModel?.id ?? 'AI'
      pillRoot.render(<Pill state={state} model={model} />)
      toolbarRoot.render(state === 'ready' ? <Toolbar editor={ed} model={model} /> : null)
      ed.layoutContentWidget(toolbarWidget)
    }

    render(getInlineAIState())
    const unsub = subscribeInlineAIState(render)
    const cursorSub = ed.onDidChangeCursorPosition(() => ed.layoutContentWidget(toolbarWidget))

    return () => {
      unsub()
      cursorSub.dispose()
      ed.removeOverlayWidget(pillWidget)
      ed.removeContentWidget(toolbarWidget)
      pillRoot.unmount()
      toolbarRoot.unmount()
    }
  }, [ed])
}

function Pill({ state, model }: { state: InlineAIState; model: string }) {
  if (state === 'idle') return null
  return (
    <div className="m-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
      {state === 'thinking'
        ? <Loader2 size={10} className="animate-spin" />
        : <Sparkles size={10} />}
      <span>{model}</span>
      {state === 'thinking'
        ? <Kbd size="sm">Esc</Kbd>
        : <Kbd size="sm">Tab</Kbd>}
    </div>
  )
}

function Toolbar({ editor: ed, model }: { editor: editor.IStandaloneCodeEditor; model: string }) {
  return (
    <div className="mt-1 inline-flex items-center gap-0.5 rounded border border-border-default bg-bg-secondary p-0.5 shadow-sm">
      <Button
        variant="ghost"
        size="xs"
        className="!h-6 !px-1.5 gap-1 text-success"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.commit', null)}
      >
        <Check size={11} /> Accept <Kbd size="sm">Tab</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="xs"
        className="!h-6 !px-1.5 gap-1 text-error"
        onClick={() => ed.trigger('verql', 'editor.action.inlineSuggest.hide', null)}
      >
        <X size={11} /> Reject <Kbd size="sm">Esc</Kbd>
      </Button>
      <Text as="span" size="xs" color="muted" className="px-1.5">{model}</Text>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/hooks/useAIInlineSuggest.ts
git commit -m "feat(editor): useAIInlineSuggest hook (status pill + Accept/Reject toolbar)"
```

---

### Task 8: Wire `useAIInlineSuggest` and `Cmd+\` manual trigger in QueryEditor

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`

- [ ] **Step 1: Mount the hook**

Add the import in `QueryEditor.tsx`:

```tsx
import { useAIInlineSuggest } from '@/hooks/useAIInlineSuggest'
```

After the existing `useEffect`s, add:

```tsx
useAIInlineSuggest(language === 'sql' ? editorInstance : null)
```

- [ ] **Step 2: Register the manual trigger keybinding**

Inside the keybindings `useEffect` (where `actions` is built), append:

```ts
if (language === 'sql') {
  actions.push({
    id: 'ai-inline-trigger',
    label: 'Trigger AI Suggestion',
    bindingId: 'ai-inline-trigger',
    fallback: monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Backslash,
    run: () => editorInstance.trigger('verql', 'editor.action.inlineSuggest.trigger', null),
  })
}
```

- [ ] **Step 3: Smoke-test**

Run: `pnpm dev`. With an active SQL connection:
- Type a partial query and pause for ~300ms — the bottom-right pill should flip from hidden to `thinking` (spinner) to `ready` (sparkles + `Tab`).
- When ghost text appears, the Accept/Reject toolbar should appear under the cursor.
- Press `Cmd+\` on a different line — pill flips to `thinking` immediately.
- Press `Esc` while ghost text is showing — toolbar and ghost disappear.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc -b --noEmit` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx
git commit -m "feat(editor): wire AI inline-suggest overlays and Cmd+\\ trigger"
```

---

## Section 3 — Explain card

### Task 9: Extend `explainResults` to return `model` and `durationMs`; allow markdown in the prompt

**Files:**
- Modify: `src/main/plugins/bundled/ai/internal/enhancements.ts`
- Modify: `shared/ipc.ts`

- [ ] **Step 1: Update the IPC return type**

In `shared/ipc.ts`, change the `ai:explain-results` entry:

```ts
  'ai:explain-results': {
    args: [request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }]
    return: { explanation: string; model: string; durationMs: number }
  }
```

- [ ] **Step 2: Update the system prompt + return shape**

In `src/main/plugins/bundled/ai/internal/enhancements.ts`, replace the `explainResults` function body:

```ts
    explainResults: async (request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }): Promise<{ explanation: string; model: string; durationMs: number }> => {
      const systemPrompt = `You are a data-analysis function. Your output is rendered as Markdown in a small UI panel inside a database client.

Given a query and a sample of its results, produce a concise explanation:
- One sentence on what the query does.
- One to three sentences on notable patterns, distributions, or anomalies in the returned data.
- If the result set is empty or suspicious, say so.

Keep the total response under 120 words. You may use light Markdown — short \`code\` spans for identifiers and triple-backtick fenced blocks for SQL when truly useful. Do not use headings or bullet lists.

Do not reproduce the query. Do not suggest alternative queries. Do not offer to help further.`

      const sampleData = request.sampleRows.slice(0, 5)
      const userPrompt = `Query: ${request.sql}

Columns: ${request.columns.join(', ')}
Total rows: ${request.rowCount}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`

      const startedAt = Date.now()
      const explanation = await callProvider(deps, systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 400
      })
      const model = deps.getActiveModelId?.() ?? 'unknown'
      return { explanation, model, durationMs: Date.now() - startedAt }
    }
```

Note: if `deps.getActiveModelId` isn't already exposed on the deps object, add it where `enhancements.ts` constructs its `deps` — it should already be available via the provider registry. Search the file for `deps.` to confirm the right shape.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add shared/ipc.ts src/main/plugins/bundled/ai/internal/enhancements.ts
git commit -m "feat(ai): explainResults returns model + durationMs; allow light markdown"
```

---

### Task 10: Add streaming explain channels in the AI plugin

**Files:**
- Modify: `shared/ipc.ts`
- Modify: `src/main/plugins/bundled/ai/internal/index.ts`
- Modify: `src/main/plugins/bundled/ai/internal/enhancements.ts`

- [ ] **Step 1: Add channels to `shared/ipc.ts`**

Add to the channel-shape interface (next to `ai:explain-results`):

```ts
  'ai:explain:start': {
    args: [request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }]
    return: { streamId: string; model: string }
  }
  'ai:explain:abort': {
    args: [streamId: string]
    return: void
  }
```

In the event-channels interface (where `ai:chat:event` is defined):

```ts
  'ai:explain:event': [event:
    | { streamId: string; kind: 'token'; text: string }
    | { streamId: string; kind: 'done'; durationMs: number }
    | { streamId: string; kind: 'error'; message: string }
  ]
```

Add to the `IPC_CHANNELS` constant:

```ts
  AI_EXPLAIN_START: 'ai:explain:start',
  AI_EXPLAIN_ABORT: 'ai:explain:abort',
  AI_EXPLAIN_EVENT: 'ai:explain:event',
```

- [ ] **Step 2: Implement a streaming variant of explainResults**

In `enhancements.ts`, add (alongside `explainResults`):

```ts
First, hoist the prompt out of `explainResults` (Task 9) into a module-scoped constant so both the streaming and non-streaming variants share one source of truth:

```ts
const EXPLAIN_SYSTEM_PROMPT = `You are a data-analysis function. Your output is rendered as Markdown in a small UI panel inside a database client.

Given a query and a sample of its results, produce a concise explanation:
- One sentence on what the query does.
- One to three sentences on notable patterns, distributions, or anomalies in the returned data.
- If the result set is empty or suspicious, say so.

Keep the total response under 120 words. You may use light Markdown — short \`code\` spans for identifiers and triple-backtick fenced blocks for SQL when truly useful. Do not use headings or bullet lists.

Do not reproduce the query. Do not suggest alternative queries. Do not offer to help further.`
```

Update `explainResults` from Task 9 to reference `EXPLAIN_SYSTEM_PROMPT` instead of its inline string. Then add the streaming sibling:

```ts
    explainResultsStream: async (
      request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] },
      onToken: (text: string) => void,
      signal: AbortSignal,
    ): Promise<{ model: string; durationMs: number }> => {
      const systemPrompt = EXPLAIN_SYSTEM_PROMPT
      const sampleData = request.sampleRows.slice(0, 5)
      const userPrompt = `Query: ${request.sql}

Columns: ${request.columns.join(', ')}
Total rows: ${request.rowCount}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}`

      const startedAt = Date.now()
      // callProvider must support streaming — if it doesn't yet, fall back to
      // a single non-streaming call and emit the result as one token.
      await callProviderStreaming(deps, systemPrompt, userPrompt, {
        temperature: 0.3, maxTokens: 400,
      }, onToken, signal)
      const model = deps.getActiveModelId?.() ?? 'unknown'
      return { model, durationMs: Date.now() - startedAt }
    },
```

Implementation note for the engineer: if `callProvider` does not already have a streaming sibling, look at how `ConversationManager` streams chat responses (`src/main/plugins/bundled/ai/internal/conversation-manager.ts`) — it already streams from each provider. Lift that streaming primitive into a helper named `callProviderStreaming` colocated in `enhancements.ts` (or in a new `internal/call-provider.ts` if you find both `enhancements.ts` and the chat path constructing provider calls — DRY them up in that case).

- [ ] **Step 3: Register the IPC handlers**

In `src/main/plugins/bundled/ai/internal/index.ts`, alongside the existing `h('ai:explain-results', …)` registration:

```ts
import { randomUUID } from 'node:crypto'
// ...

const explainAborts = new Map<string, AbortController>()

h('ai:explain:start', async (request, sender) => {
  const streamId = randomUUID()
  const controller = new AbortController()
  explainAborts.set(streamId, controller)
  const onToken = (text: string) => {
    sender.send('ai:explain:event', { streamId, kind: 'token', text })
  }
  ;(async () => {
    try {
      const { model, durationMs } = await enhancements.explainResultsStream(request, onToken, controller.signal)
      sender.send('ai:explain:event', { streamId, kind: 'done', durationMs })
      void model
    } catch (err) {
      sender.send('ai:explain:event', { streamId, kind: 'error', message: (err as Error).message })
    } finally {
      explainAborts.delete(streamId)
    }
  })()
  const model = deps.getActiveModelId?.() ?? 'unknown'
  return { streamId, model }
})

h('ai:explain:abort', async (streamId: string) => {
  explainAborts.get(streamId)?.abort()
  explainAborts.delete(streamId)
})
```

Note: adapt `sender.send` to whatever event-emit helper the existing `ai:chat:event` plumbing uses (look at how `conversation-manager.ts` emits events).

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc -b --noEmit` → PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/ipc.ts src/main/plugins/bundled/ai/internal/enhancements.ts src/main/plugins/bundled/ai/internal/index.ts
git commit -m "feat(ai): streaming explain channel (start/event/abort)"
```

---

### Task 11: Extend `useExplainStore` for streaming, model, and duration

**Files:**
- Modify: `src/renderer/src/stores/explain.ts`

- [ ] **Step 1: Replace the store**

Replace the contents of `src/renderer/src/stores/explain.ts`:

```ts
import { create } from 'zustand'

interface PerTab {
  loading: boolean
  streamingText: string
  streamId: string | null
  model: string | null
  durationMs: number | null
  error: string | null
}

interface ExplainState {
  byTab: Record<string, PerTab>
  setLoading(tabId: string, value: boolean): void
  startStream(tabId: string, streamId: string, model: string): void
  appendToken(tabId: string, text: string): void
  finishStream(tabId: string, durationMs: number): void
  failStream(tabId: string, message: string): void
  resetTab(tabId: string): void
}

const empty: PerTab = {
  loading: false, streamingText: '', streamId: null, model: null,
  durationMs: null, error: null,
}

function patch(s: ExplainState, tabId: string, p: Partial<PerTab>): { byTab: Record<string, PerTab> } {
  const prev = s.byTab[tabId] ?? empty
  return { byTab: { ...s.byTab, [tabId]: { ...prev, ...p } } }
}

export const useExplainStore = create<ExplainState>((set) => ({
  byTab: {},
  setLoading(tabId, value) { set((s) => patch(s, tabId, { loading: value })) },
  startStream(tabId, streamId, model) {
    set((s) => patch(s, tabId, {
      loading: true, streamingText: '', streamId, model,
      durationMs: null, error: null,
    }))
  },
  appendToken(tabId, text) {
    set((s) => patch(s, tabId, { streamingText: (s.byTab[tabId]?.streamingText ?? '') + text }))
  },
  finishStream(tabId, durationMs) {
    set((s) => patch(s, tabId, { loading: false, streamId: null, durationMs }))
  },
  failStream(tabId, message) {
    set((s) => patch(s, tabId, { loading: false, streamId: null, error: message }))
  },
  resetTab(tabId) {
    set((s) => ({ byTab: { ...s.byTab, [tabId]: empty } }))
  },
}))
```

- [ ] **Step 2: Update existing consumers**

`ExplainPanel.tsx` reads `useExplainStore(s => s.loading[tabId] ?? false)` — that lookup path changed. Update both sites in `ExplainPanel.tsx`:

```tsx
const loading = useExplainStore(s => s.byTab[tabId]?.loading ?? false)
```

(The full `ExplainResult` rebuild lands in Task 12 — this step just keeps the old call site compiling.)

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/stores/explain.ts src/renderer/src/components/ai/ExplainPanel.tsx
git commit -m "refactor(explain): extend store with streaming, model, duration"
```

---

### Task 12: Rebuild `ExplainResult` card with markdown, actions, streaming, and skeleton

**Files:**
- Modify: `src/renderer/src/components/ai/ExplainPanel.tsx`

- [ ] **Step 1: Replace `ExplainResult` and update `ExplainPanel` trigger**

Replace the file contents of `src/renderer/src/components/ai/ExplainPanel.tsx`:

```tsx
import { useCallback, useEffect, useRef } from 'react'
import { Sparkles, Copy, RefreshCcw, MessageSquarePlus, Square, Loader2, AlertCircle } from 'lucide-react'
import type { QueryResult } from '@shared/types'
import { Button } from '@/primitives/forms/Button'
import { Text } from '@/primitives/typography/Text'
import { Flex } from '@/primitives/layout/Flex'
import { MarkdownContent } from '@/components/ai/MarkdownContent'
import { useTabsStore } from '@/stores/tabs'
import { useExplainStore } from '@/stores/explain'
import { useAIStore } from '@/stores/ai'
import { useUIStore } from '@/stores/ui'
import { notifyError } from '@/lib/notify-error'
import { parseAppError } from '@/lib/db-error'
import { IPC_CHANNELS } from '@shared/ipc'

interface Props {
  tabId: string
  sql: string
  results: QueryResult
  explanation: string | null
}

export function ExplainPanel({ tabId, sql, results, explanation }: Props) {
  const loading = useExplainStore(s => s.byTab[tabId]?.loading ?? false)
  const { startStream } = useExplainStore.getState()

  const run = useCallback(async () => {
    if (loading) return
    const request = {
      sql,
      columns: results.fields.map(f => f.name),
      rowCount: results.rowCount,
      sampleRows: results.rows.slice(0, 5),
    }
    try {
      const { streamId, model } = await window.electronAPI.invoke(
        IPC_CHANNELS.AI_EXPLAIN_START,
        request,
      ) as { streamId: string; model: string }
      startStream(tabId, streamId, model)
    } catch (err) {
      const parsed = parseAppError(err)
      useExplainStore.getState().failStream(tabId, parsed.message)
      notifyError(err, { titlePrefix: 'AI: Explain failed' })
    }
  }, [tabId, sql, results, loading, startStream])

  return (
    <Button variant="ghost" size="xs" className="!h-6 !px-2 gap-1" onClick={run} disabled={loading}>
      {loading
        ? <Loader2 size={10} className="animate-spin text-accent" />
        : <Sparkles size={10} className={explanation ? 'text-accent' : 'text-text-muted'} />}
      Explain
    </Button>
  )
}

export function ExplainResult({ tabId, explanation }: { tabId: string; explanation: string | null }) {
  const per = useExplainStore(s => s.byTab[tabId])
  const setTabAiExplanation = useTabsStore(s => s.setTabAiExplanation)

  // Subscribe to streaming events for THIS tab.
  useEffect(() => {
    const off = window.electronAPI.on(IPC_CHANNELS.AI_EXPLAIN_EVENT, (event) => {
      const e = event as { streamId: string; kind: string; text?: string; durationMs?: number; message?: string }
      const cur = useExplainStore.getState().byTab[tabId]
      if (!cur || e.streamId !== cur.streamId) return
      if (e.kind === 'token' && e.text) {
        useExplainStore.getState().appendToken(tabId, e.text)
      } else if (e.kind === 'done') {
        const finalText = useExplainStore.getState().byTab[tabId]?.streamingText ?? ''
        setTabAiExplanation(tabId, finalText)
        useExplainStore.getState().finishStream(tabId, e.durationMs ?? 0)
      } else if (e.kind === 'error') {
        useExplainStore.getState().failStream(tabId, e.message ?? 'Stream failed')
      }
    })
    return off
  }, [tabId, setTabAiExplanation])

  if (!per?.loading && !explanation && !per?.error) return null

  const streamingText = per?.streamingText ?? ''
  const display = streamingText || explanation || ''

  return (
    <div className="border-t border-accent/30 bg-bg-secondary shrink-0">
      <Flex align="center" gap={2} className="px-3 py-1.5 border-b border-border-default/40">
        <Sparkles size={12} className="text-accent" />
        <Text size="xs" className="text-accent font-medium">Explanation</Text>
        <Flex align="center" gap={1} className="ml-auto">
          {per?.loading
            ? <StopButton tabId={tabId} streamId={per?.streamId} />
            : <ModelDurationLabel model={per?.model} durationMs={per?.durationMs} />}
        </Flex>
      </Flex>
      <div className="px-3 py-2 text-sm text-text-secondary max-h-48 overflow-auto">
        {per?.error
          ? <ErrorRow message={per.error} />
          : per?.loading && !streamingText
            ? <SkeletonBody />
            : <MarkdownContent>{display}</MarkdownContent>}
      </div>
      {!per?.loading && (explanation || streamingText) ? (
        <ActionBar tabId={tabId} sql={getCurrentSqlForTab(tabId)} text={display} />
      ) : null}
    </div>
  )
}

function StopButton({ tabId, streamId }: { tabId: string; streamId: string | null | undefined }) {
  return (
    <Button
      variant="ghost"
      size="xs"
      className="!h-6 !px-1.5 gap-1 text-text-muted"
      onClick={() => {
        if (streamId) void window.electronAPI.invoke(IPC_CHANNELS.AI_EXPLAIN_ABORT, streamId)
        useExplainStore.getState().failStream(tabId, 'Stopped')
      }}
    >
      <Square size={10} /> Stop
    </Button>
  )
}

function ModelDurationLabel({ model, durationMs }: { model: string | null | undefined; durationMs: number | null | undefined }) {
  if (!model && durationMs == null) return null
  const ms = durationMs != null ? (durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`) : null
  return <Text size="xs" color="muted">{[model, ms].filter(Boolean).join(' · ')}</Text>
}

function ErrorRow({ message }: { message: string }) {
  return (
    <Flex align="center" gap={1.5}>
      <AlertCircle size={12} className="text-error" />
      <Text size="xs" color="error">{message}</Text>
    </Flex>
  )
}

function SkeletonBody() {
  return (
    <div className="space-y-1.5 py-1">
      <div className="h-3 rounded bg-bg-tertiary animate-pulse w-[90%]" />
      <div className="h-3 rounded bg-bg-tertiary animate-pulse w-[75%]" />
      <div className="h-3 rounded bg-bg-tertiary animate-pulse w-[60%]" />
    </div>
  )
}

function ActionBar({ tabId, sql, text }: { tabId: string; sql: string; text: string }) {
  const askInChat = useCallback(() => {
    const prefill = `> ${sql.split('\n').join('\n> ')}\n\nFollow-up about this explanation:\n\n${text}\n\n`
    useAIStore.getState().setComposerDraft?.(prefill)
    useUIStore.getState().setSecondaryPanel?.('ai')
  }, [sql, text])

  return (
    <Flex gap={1} className="px-3 py-1 border-t border-border-default/40">
      <Button variant="ghost" size="xs" className="!h-6 !px-1.5 gap-1" onClick={() => navigator.clipboard.writeText(text)}>
        <Copy size={10} /> Copy
      </Button>
      <Button variant="ghost" size="xs" className="!h-6 !px-1.5 gap-1" onClick={() => {/* see Task 12 step 2 */}}>
        <RefreshCcw size={10} /> Regenerate
      </Button>
      <Button variant="ghost" size="xs" className="!h-6 !px-1.5 gap-1" onClick={askInChat}>
        <MessageSquarePlus size={10} /> Ask follow-up
      </Button>
    </Flex>
  )
}

function getCurrentSqlForTab(tabId: string): string {
  const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId)
  return tab && tab.type === 'query' ? tab.sql : ''
}
```

- [ ] **Step 2: Wire Regenerate**

In `ActionBar`, replace the `onClick` for Regenerate with:

```tsx
onClick={async () => {
  const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId)
  if (!tab || tab.type !== 'query' || !tab.result) return
  const request = {
    sql: tab.sql,
    columns: tab.result.fields.map(f => f.name),
    rowCount: tab.result.rowCount,
    sampleRows: tab.result.rows.slice(0, 5),
  }
  const { streamId, model } = await window.electronAPI.invoke(
    IPC_CHANNELS.AI_EXPLAIN_START, request,
  ) as { streamId: string; model: string }
  useExplainStore.getState().startStream(tabId, streamId, model)
}}
```

- [ ] **Step 3: Verify `useAIStore.setComposerDraft` and `useUIStore.setSecondaryPanel` exist**

Run: `grep -n "setComposerDraft\|setSecondaryPanel" src/renderer/src/stores/ai.ts src/renderer/src/stores/ui.ts`.

If `setComposerDraft` doesn't exist, add it to `useAIStore` (mirror the existing message-setter pattern). If `setSecondaryPanel` doesn't exist, search for the panel-switch action in `useUIStore` (it may be named differently, e.g., `setActiveSecondary`). Adjust the call in `ActionBar` accordingly.

- [ ] **Step 4: Typecheck + smoke-test**

Run: `pnpm exec tsc -b --noEmit` → PASS.
Run: `pnpm dev`, run a query, click **Explain**:
- Header shows `Sparkles + Explanation` and a Stop button while streaming.
- Tokens stream into the body.
- When done, header shows model + duration, action bar appears.
- Click **Copy** — clipboard contains markdown source.
- Click **Regenerate** — explanation re-streams.
- Click **Ask follow-up** — AI chat panel opens with the SQL quoted in the composer.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/ai/ExplainPanel.tsx
git commit -m "feat(explain): markdown card with streaming, actions, skeleton"
```

---

### Task 13: Storybook stories

**Files:**
- Create: `src/renderer/src/components/query/StatementGutter.stories.tsx`
- Create: `src/renderer/src/components/ai/ExplainCard.stories.tsx`

- [ ] **Step 1: Read the Storybook conventions**

Use the `get-storybook-story-instructions` MCP tool (per project CLAUDE.md). For component-prop usage in either story, use `get-documentation` from the Storybook MCP to verify props on `Button`, `Kbd`, `Text`, `Flex`.

- [ ] **Step 2: Write `StatementGutter.stories.tsx`**

Cover: empty model, single statement (`SELECT 1`), multi-statement, running status, error status, success-with-row-count status. Mock `useStatementStatus` state by `setState`-ing the store before each story.

The component requires a Monaco editor instance. The cleanest way is to render a stripped-down `<MonacoFixtureEditor>` helper in the story file that mounts a real editor against a test model and passes it to `StatementGutter`. If that's too heavy, fall back to a "presentation-only" subcomponent (`GutterRow`) and story those rows directly.

- [ ] **Step 3: Write `ExplainCard.stories.tsx`**

Cover: loading skeleton, streaming (with growing text), complete (markdown + code block), error, empty/no-tab. Use `useExplainStore.setState` to inject state for each story.

- [ ] **Step 4: Run story tests**

Use the Storybook MCP `run-story-tests` tool against both new stories. All must pass and accessibility checks must be green.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/query/StatementGutter.stories.tsx src/renderer/src/components/ai/ExplainCard.stories.tsx
git commit -m "test(storybook): StatementGutter and ExplainCard stories"
```

---

## Polish

### Task 14: Docs and changeset

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/ai.md`
- Create: `.changeset/editor-ai-surfaces.md`

- [ ] **Step 1: Update architecture doc**

In `docs/architecture.md`, find the editor section and replace any "CodeLens" reference with a one-paragraph description of the `StatementGutter` overlay + `LensAction.icon`. Note the boundary: drivers still contribute `splitStatements + lensActions`; only the renderer changed.

- [ ] **Step 2: Update AI doc**

In `docs/ai.md`, add a subsection under the assistant features:

```markdown
### Streaming explain results

`ai:explain:start` returns `{ streamId, model }`; the plugin emits
`ai:explain:event` messages (`token` | `done` | `error`) keyed by `streamId`
until completion. Callers may abort with `ai:explain:abort(streamId)`. The
renderer's Results bar uses this for token-by-token rendering with a Stop
button.
```

- [ ] **Step 3: Add changeset**

Create `.changeset/editor-ai-surfaces.md`:

```markdown
---
"verql": minor
---

Editor AI redesign: replace the CodeLens "Run / Explain" bar with a custom
statement gutter (lucide icons + per-statement status chip); add an
Accept/Reject toolbar and status pill to inline AI ghost-text; rebuild the
Explain-results panel with Markdown, streaming, Copy/Regenerate/Ask-follow-up
actions. No ASCII glyphs remain in the touched surfaces.
```

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md docs/ai.md .changeset/editor-ai-surfaces.md
git commit -m "docs: editor AI surfaces redesign + changeset"
```

---

### Task 15: Final audit + full build

- [ ] **Step 1: Grep for icon glyphs in touched files**

Run:

```bash
grep -nE "[▶▶►◀◆◇○●■□★☆✓✗✕✖↑↓⇒⇐⇑⇓]" \
  src/renderer/src/components/query/StatementGutter.tsx \
  src/renderer/src/components/ai/ExplainPanel.tsx \
  src/renderer/src/hooks/useAIInlineSuggest.ts \
  src/renderer/src/lib/statement-contributions/sql.ts \
  src/renderer/src/lib/monaco-ai-completion.ts \
  src/renderer/src/components/query/QueryEditor.tsx
```

Expected: no matches.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Unit + storybook tests**

Run: `pnpm test`
Expected: PASS — including the new `statement-status` and `statement-hash` suites and both new stories.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 5: Final manual smoke (dev app)**

Run: `pnpm dev`. With a SQL connection:
- Statement gutter shows lucide icons + status chips.
- Inline ghost-text pill toggles `thinking` → `ready`; Accept/Reject toolbar appears with ghost; `Cmd+\` triggers a suggestion.
- Explain streams markdown; Stop cancels; Copy/Regenerate/Ask follow-up all work; AI panel opens with the SQL quoted in the composer.

- [ ] **Step 6: Open the PR**

The branch should be a feature branch (not `main`). Push and open the PR with title `feat(editor): IntelliJ-style AI surfaces (gutter, inline ghost, explain card)` and a body that links to both the spec and this plan.

---

## Open questions tracked from the spec

- **Pending-suggestion signal**: Task 6 uses a tiny pub-sub inside `monaco-ai-completion.ts`. Acceptable per the spec; revisit if a future Monaco upgrade exposes a public event.
- **Hash collisions**: Task 2 uses 32-bit FNV-1a. If implementers see false-positive status carryover in practice, swap to 64-bit FNV; the public API of `hashStatement` doesn't change.
