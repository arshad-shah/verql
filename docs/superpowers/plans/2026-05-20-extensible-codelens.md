# Extensible CodeLens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded SQL CodeLens with a per-DB contribution registry so each plugin defines its own statement splitter and lens actions; fix the bug where multiple statements in one tab render a single set of buttons.

**Architecture:** A renderer-side `statement-registry` keyed by `dbType` mirrors the existing `completion-registry` pattern. Each contribution exposes `splitStatements(source) → Statement[]` (with full start/end ranges) and an ordered list of `LensAction`s with handlers. The Monaco CodeLens provider resolves the active tab's `dbType` via the editor registry, asks the contribution for statements, and emits one lens per `(statement × action)`. Lens clicks fire a single generic Monaco command that routes through the registry to the contribution's handler — replacing the old `window.dispatchEvent('nova:run-statement' | 'nova:explain-statement')` indirection.

**Tech Stack:** TypeScript, React 19, Monaco editor (`@monaco-editor/react`), Vitest, Electron renderer process.

**Reference spec:** `docs/superpowers/specs/2026-05-20-extensible-codelens-design.md`

---

## File Structure

**New files:**
- `src/renderer/src/lib/statement-registry.ts` — registry, types, `invokeLensAction`.
- `src/renderer/src/lib/statement-contributions/sql.ts` — SQL splitter + run/explain actions; exports `sqlStatementContribution`.
- `src/renderer/src/lib/statement-contributions/mongodb.ts` — Mongo splitter + run action.
- `src/renderer/src/lib/statement-contributions/redis.ts` — Redis splitter + run action.
- `src/renderer/src/lib/statement-contributions/index.ts` — `registerBuiltinStatementContributions()`.
- `tests/unit/statement-splitter-sql.test.ts`
- `tests/unit/statement-splitter-redis.test.ts`
- `tests/unit/statement-splitter-mongo.test.ts`
- `tests/unit/statement-registry.test.ts`

**Rewritten:**
- `src/renderer/src/lib/monaco-codelens.ts` — thin Monaco shell only.

**Modified:**
- `src/renderer/src/stores/editor.ts` — add `getByModelUri(uri)`, switch from single-slot to map keyed by tabId.
- `src/renderer/src/stores/tab-actions.ts` — add `runStatement(tabId, sql)`, `explainStatement(tabId, sql)`.
- `src/renderer/src/components/query/QueryPanel.tsx` — register `runStatement`/`explainStatement` in `tabActions`; delete the `window.addEventListener('nova:run-statement' | 'nova:explain-statement', …)` block.
- `src/renderer/src/components/query/QueryEditor.tsx` — call new `installCodeLensCommand` + `registerCodeLensProviderForLanguage` unconditionally for every language.
- `src/renderer/src/App.tsx` — call `registerBuiltinStatementContributions()` once at boot.

---

### Task 1: Statement registry (types + storage + invoke)

**Files:**
- Create: `src/renderer/src/lib/statement-registry.ts`
- Test: `tests/unit/statement-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/statement-registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerStatementContribution,
  getStatementContribution,
  invokeLensAction,
  _resetForTests,
  type Statement,
  type StatementContribution,
} from '@/lib/statement-registry'

const stmt: Statement = { startLine: 1, startColumn: 1, endLine: 1, endColumn: 5, text: 'SHOW' }

function make(handler: (sql: string) => void): StatementContribution {
  return {
    splitStatements: () => [stmt],
    lensActions: [
      { id: 'run', title: '▶ Run', handler: (ctx) => handler(ctx.stmt.text) },
    ],
  }
}

describe('statement-registry', () => {
  beforeEach(() => _resetForTests())

  it('registers and retrieves a contribution', () => {
    const c = make(() => {})
    registerStatementContribution('postgresql', c)
    expect(getStatementContribution('postgresql')).toBe(c)
  })

  it('re-registering replaces the previous contribution', () => {
    const a = make(() => {})
    const b = make(() => {})
    registerStatementContribution('postgresql', a)
    registerStatementContribution('postgresql', b)
    expect(getStatementContribution('postgresql')).toBe(b)
  })

  it('invokeLensAction calls the matching action handler', () => {
    let received = ''
    registerStatementContribution('postgresql', make((s) => { received = s }))
    invokeLensAction('postgresql', 'run', {
      stmt, tabId: 't1', connectionId: 'c1', dbType: 'postgresql',
    })
    expect(received).toBe('SHOW')
  })

  it('invokeLensAction is a no-op for unknown dbType', () => {
    expect(() => invokeLensAction('nope', 'run', {
      stmt, tabId: 't1', connectionId: null, dbType: 'nope',
    })).not.toThrow()
  })

  it('invokeLensAction is a no-op for unknown actionId', () => {
    registerStatementContribution('postgresql', make(() => {}))
    expect(() => invokeLensAction('postgresql', 'nope', {
      stmt, tabId: 't1', connectionId: 'c1', dbType: 'postgresql',
    })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/statement-registry.test.ts`
Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement the registry**

```ts
// src/renderer/src/lib/statement-registry.ts
/**
 * Per-DB CodeLens contributions. Each plugin (or bundled DB module) registers
 * a splitter + an ordered list of lens actions keyed by dbType. The Monaco
 * CodeLens provider in monaco-codelens.ts is the only consumer.
 */
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
  id: string
  title: string
  when?: (stmt: Statement) => boolean
  handler: (ctx: LensActionContext) => void
}

export interface StatementContribution {
  splitStatements(source: string): Statement[]
  lensActions: LensAction[]
}

const contributions = new Map<string, StatementContribution>()

export function registerStatementContribution(dbType: string, c: StatementContribution): void {
  contributions.set(dbType, c)
}

export function getStatementContribution(dbType: string): StatementContribution | undefined {
  return contributions.get(dbType)
}

export function invokeLensAction(dbType: string, actionId: string, ctx: LensActionContext): void {
  const c = contributions.get(dbType)
  if (!c) return
  const action = c.lensActions.find((a) => a.id === actionId)
  if (!action) return
  action.handler(ctx)
}

/** Test-only: clear the registry between test cases. */
export function _resetForTests(): void {
  contributions.clear()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/statement-registry.test.ts`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/statement-registry.ts tests/unit/statement-registry.test.ts
git commit -m "feat(codelens): add per-DB statement contribution registry"
```

---

### Task 2: SQL splitter

**Files:**
- Create: `src/renderer/src/lib/statement-contributions/sql.ts` (splitter portion only — lens actions added in Task 5)
- Test: `tests/unit/statement-splitter-sql.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/statement-splitter-sql.test.ts
import { describe, it, expect } from 'vitest'
import { splitSqlStatements } from '@/lib/statement-contributions/sql'

describe('splitSqlStatements', () => {
  it('returns empty for empty/whitespace input', () => {
    expect(splitSqlStatements('')).toEqual([])
    expect(splitSqlStatements('   \n  \t  ')).toEqual([])
  })

  it('splits on top-level semicolons', () => {
    const r = splitSqlStatements('SELECT 1; SELECT 2;')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1', 'SELECT 2'])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(1)
    expect(r[0].startColumn).toBe(1)
    expect(r[1].startColumn).toBeGreaterThan(r[0].endColumn)
  })

  it('detects boundary on newline + statement keyword (no semicolon)', () => {
    const r = splitSqlStatements('SELECT 1\nSELECT 2')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1', 'SELECT 2'])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(2)
  })

  it('handles mixed terminators', () => {
    const r = splitSqlStatements('SELECT 1;\nUPDATE t SET x=1 WHERE id=1\nDELETE FROM t WHERE id=2;')
    expect(r.map((s) => s.text)).toEqual([
      'SELECT 1',
      'UPDATE t SET x=1 WHERE id=1',
      'DELETE FROM t WHERE id=2',
    ])
    expect(r[0].startLine).toBe(1)
    expect(r[1].startLine).toBe(2)
    expect(r[2].startLine).toBe(3)
  })

  it('ignores semicolons inside string literals', () => {
    const r = splitSqlStatements("SELECT ';not a delim;'; SELECT 2")
    expect(r.map((s) => s.text)).toEqual(["SELECT ';not a delim;'", 'SELECT 2'])
  })

  it('ignores keywords inside line and block comments', () => {
    const r = splitSqlStatements('SELECT 1 -- SELECT fake\n/* SELECT also fake */\n;\nSELECT 2')
    expect(r.map((s) => s.text.trim().startsWith('SELECT 1') || s.text.trim().startsWith('SELECT 2'))).toEqual([true, true])
    expect(r).toHaveLength(2)
  })

  it('captures full statement range (multi-line)', () => {
    const r = splitSqlStatements('SELECT\n  *\nFROM t')
    expect(r).toHaveLength(1)
    expect(r[0].startLine).toBe(1)
    expect(r[0].endLine).toBe(3)
  })

  it('emits one statement when no terminator and no keyword break', () => {
    const r = splitSqlStatements('SELECT a, b, c FROM t WHERE x = 1')
    expect(r).toHaveLength(1)
  })

  it('drops empty segments from trailing semicolons', () => {
    const r = splitSqlStatements('SELECT 1;;\n;')
    expect(r.map((s) => s.text)).toEqual(['SELECT 1'])
  })

  it('handles WITH (CTE) as a statement starter', () => {
    const r = splitSqlStatements('SELECT 1\nWITH cte AS (SELECT 1) SELECT * FROM cte')
    expect(r).toHaveLength(2)
    expect(r[1].text.startsWith('WITH')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/statement-splitter-sql.test.ts`
Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement the SQL splitter**

```ts
// src/renderer/src/lib/statement-contributions/sql.ts
import type { Statement } from '@/lib/statement-registry'

const STATEMENT_KEYWORDS = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CREATE', 'ALTER', 'DROP',
  'TRUNCATE', 'EXPLAIN', 'BEGIN', 'COMMIT', 'ROLLBACK', 'GRANT', 'REVOKE',
  'SHOW', 'USE', 'VACUUM', 'ANALYZE', 'SET',
])

interface Pos { line: number; col: number }

/**
 * Walks the source once, tracking line/column. Recognises strings and comments
 * so semicolons / keywords inside them don't split. Emits a statement when:
 *   (a) it hits a top-level `;`, or
 *   (b) it sees a newline and the next non-whitespace token is a STATEMENT_KEYWORDS member.
 * Empty / whitespace-only segments are dropped.
 */
export function splitSqlStatements(source: string): Statement[] {
  const out: Statement[] = []
  let i = 0
  let line = 1
  let col = 1
  let stmtStart = 0
  let stmtStartLine = 1
  let stmtStartCol = 1

  const flush = (endExclusive: number, endLine: number, endCol: number) => {
    const text = source.slice(stmtStart, endExclusive)
    const trimmed = text.trim()
    if (trimmed) {
      const lead = text.length - text.trimStart().length
      const trail = text.length - text.trimEnd().length
      const start = advancePos(source, stmtStart, stmtStartLine, stmtStartCol, lead)
      const end = advancePos(source, stmtStart, stmtStartLine, stmtStartCol, text.length - trail)
      out.push({
        startLine: start.line,
        startColumn: start.col,
        endLine: end.line,
        endColumn: end.col,
        text: trimmed,
      })
    }
  }

  const setStart = (idx: number, l: number, c: number) => {
    stmtStart = idx
    stmtStartLine = l
    stmtStartCol = c
  }

  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]

    if (c === '\n') {
      // Look ahead past whitespace for a statement keyword.
      let j = i + 1
      let jLine = line + 1
      let jCol = 1
      while (j < source.length && (source[j] === ' ' || source[j] === '\t')) { j++; jCol++ }
      if (j < source.length && isKeywordStart(source, j)) {
        // Flush current statement up to (and including) this newline; new one starts at j.
        flush(i, line, col)
        line++; col = 1
        i++
        // Advance i to j to start the new statement at the keyword.
        while (i < j) { i++; col++ }
        setStart(j, jLine, jCol)
        continue
      }
      line++; col = 1; i++; continue
    }
    if (c === '-' && next === '-') {
      while (i < source.length && source[i] !== '\n') { i++; col++ }
      continue
    }
    if (c === '/' && next === '*') {
      i += 2; col += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') { line++; col = 1 } else { col++ }
        i++
      }
      i += 2; col += 2
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c
      i++; col++
      while (i < source.length) {
        if (source[i] === '\\' && source[i + 1] === quote) { i += 2; col += 2; continue }
        if (source[i] === quote) { i++; col++; break }
        if (source[i] === '\n') { line++; col = 1 } else { col++ }
        i++
      }
      continue
    }
    if (c === ';') {
      flush(i, line, col)
      i++; col++
      // Skip trailing whitespace so the next statement's startLine/Col are accurate.
      while (i < source.length && (source[i] === ' ' || source[i] === '\t')) { i++; col++ }
      if (source[i] === '\n') { i++; line++; col = 1 }
      setStart(i, line, col)
      continue
    }
    i++; col++
  }
  flush(source.length, line, col)
  return out
}

function isKeywordStart(source: string, from: number): boolean {
  let end = from
  while (end < source.length && /[A-Za-z]/.test(source[end])) end++
  const word = source.slice(from, end).toUpperCase()
  return STATEMENT_KEYWORDS.has(word)
}

/** Advances (line, col) forward by `offset` chars from index `baseIdx`. */
function advancePos(source: string, baseIdx: number, baseLine: number, baseCol: number, offset: number): Pos {
  let line = baseLine
  let col = baseCol
  for (let k = 0; k < offset; k++) {
    if (source[baseIdx + k] === '\n') { line++; col = 1 } else { col++ }
  }
  return { line, col }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/statement-splitter-sql.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/statement-contributions/sql.ts tests/unit/statement-splitter-sql.test.ts
git commit -m "feat(codelens): add SQL statement splitter with keyword-boundary detection"
```

---

### Task 3: Redis splitter

**Files:**
- Create: `src/renderer/src/lib/statement-contributions/redis.ts` (splitter portion only)
- Test: `tests/unit/statement-splitter-redis.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/statement-splitter-redis.test.ts
import { describe, it, expect } from 'vitest'
import { splitRedisStatements } from '@/lib/statement-contributions/redis'

describe('splitRedisStatements', () => {
  it('returns empty for empty input', () => {
    expect(splitRedisStatements('')).toEqual([])
  })

  it('treats each non-empty line as a statement', () => {
    const r = splitRedisStatements('GET foo\nSET bar 1\nINCR counter')
    expect(r.map((s) => s.text)).toEqual(['GET foo', 'SET bar 1', 'INCR counter'])
    expect(r.map((s) => s.startLine)).toEqual([1, 2, 3])
  })

  it('skips comment lines and blank lines', () => {
    const r = splitRedisStatements('# header\n\nGET foo\n# another\nSET bar 1')
    expect(r.map((s) => s.text)).toEqual(['GET foo', 'SET bar 1'])
    expect(r.map((s) => s.startLine)).toEqual([3, 5])
  })

  it('captures full line range including end column', () => {
    const r = splitRedisStatements('GET foo')
    expect(r[0]).toMatchObject({ startLine: 1, startColumn: 1, endLine: 1, endColumn: 8 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/statement-splitter-redis.test.ts`
Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement the Redis splitter**

```ts
// src/renderer/src/lib/statement-contributions/redis.ts
import type { Statement } from '@/lib/statement-registry'

export function splitRedisStatements(source: string): Statement[] {
  const out: Statement[] = []
  const lines = source.split('\n')
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const leading = raw.length - raw.trimStart().length
    const trailing = raw.length - raw.trimEnd().length
    out.push({
      startLine: idx + 1,
      startColumn: leading + 1,
      endLine: idx + 1,
      endColumn: raw.length - trailing + 1,
      text: trimmed,
    })
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/statement-splitter-redis.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/statement-contributions/redis.ts tests/unit/statement-splitter-redis.test.ts
git commit -m "feat(codelens): add Redis statement splitter (per-line)"
```

---

### Task 4: MongoDB splitter

**Files:**
- Create: `src/renderer/src/lib/statement-contributions/mongodb.ts` (splitter portion only)
- Test: `tests/unit/statement-splitter-mongo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/statement-splitter-mongo.test.ts
import { describe, it, expect } from 'vitest'
import { splitMongoStatements } from '@/lib/statement-contributions/mongodb'

describe('splitMongoStatements', () => {
  it('returns empty for empty input', () => {
    expect(splitMongoStatements('')).toEqual([])
  })

  it('emits one statement per balanced top-level brace group', () => {
    const src = '{"find":"users"}\n{"find":"orders"}'
    const r = splitMongoStatements(src)
    expect(r.map((s) => s.text)).toEqual(['{"find":"users"}', '{"find":"orders"}'])
    expect(r.map((s) => s.startLine)).toEqual([1, 2])
  })

  it('keeps a multi-line document as one statement', () => {
    const src = '{\n  "find": "users",\n  "limit": 10\n}'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(1)
    expect(r[0].startLine).toBe(1)
    expect(r[0].endLine).toBe(4)
  })

  it('treats two consecutive documents as separate even without blank line', () => {
    const src = '{ "a": 1 }{ "b": 2 }'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(2)
  })

  it('ignores braces inside string literals', () => {
    const src = '{ "x": "has } brace" }\n{ "y": 1 }'
    const r = splitMongoStatements(src)
    expect(r).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/statement-splitter-mongo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the Mongo splitter**

```ts
// src/renderer/src/lib/statement-contributions/mongodb.ts
import type { Statement } from '@/lib/statement-registry'

/**
 * Splits a Mongo shell buffer into one statement per top-level brace-balanced
 * JSON document. Tracks string state so '}' inside "..." doesn't close a doc.
 * Anything between documents (whitespace/newlines) is skipped.
 */
export function splitMongoStatements(source: string): Statement[] {
  const out: Statement[] = []
  let i = 0
  let line = 1
  let col = 1

  while (i < source.length) {
    const ch = source[i]
    if (ch === '\n') { line++; col = 1; i++; continue }
    if (ch === ' ' || ch === '\t') { col++; i++; continue }
    if (ch !== '{') { col++; i++; continue }

    const startLine = line
    const startCol = col
    const startIdx = i
    let depth = 0
    let inString = false
    while (i < source.length) {
      const c = source[i]
      if (inString) {
        if (c === '\\' && i + 1 < source.length) { i += 2; col += 2; continue }
        if (c === '"') inString = false
        if (c === '\n') { line++; col = 1 } else { col++ }
        i++; continue
      }
      if (c === '"') { inString = true; col++; i++; continue }
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          i++; col++
          const text = source.slice(startIdx, i)
          out.push({
            startLine, startColumn: startCol,
            endLine: line, endColumn: col,
            text,
          })
          break
        }
      }
      if (c === '\n') { line++; col = 1 } else { col++ }
      i++
    }
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/statement-splitter-mongo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/statement-contributions/mongodb.ts tests/unit/statement-splitter-mongo.test.ts
git commit -m "feat(codelens): add MongoDB statement splitter (brace-balanced)"
```

---

### Task 5: Add `runStatement` / `explainStatement` to tab-actions

**Files:**
- Modify: `src/renderer/src/stores/tab-actions.ts`
- Modify: `src/renderer/src/components/query/QueryPanel.tsx`

- [ ] **Step 1: Extend the `TabActions` interface and add helpers**

Edit `src/renderer/src/stores/tab-actions.ts`. Change the `TabActions` interface and add two helpers at the end of the `tabActions` object:

```ts
export interface TabActions {
  onSave?: () => void | Promise<void>
  isDirty?: () => boolean
  label?: string
  /** Run a single SQL statement (CodeLens "▶ Run"). */
  runStatement?: (sql: string) => void
  /** Show EXPLAIN ANALYZE plan for a single statement (CodeLens "Explain"). */
  explainStatement?: (sql: string) => void
}
```

Inside `export const tabActions = { … }` add (after `save`):

```ts
  runStatement(tabId: string, sql: string): void {
    handlers.get(tabId)?.runStatement?.(sql)
  },
  explainStatement(tabId: string, sql: string): void {
    handlers.get(tabId)?.explainStatement?.(sql)
  },
```

- [ ] **Step 2: Wire QueryPanel to register the handlers**

Edit `src/renderer/src/components/query/QueryPanel.tsx`. In the `tabActions.register(...)` call inside the `useEffect` near line 177, add the two new handlers:

```ts
useEffect(() => {
  tabActions.register(tab.id, {
    onSave: handleSave,
    isDirty: () => Boolean(useTabsStore.getState().tabs.find(t => t.id === tab.id && t.type === 'query')?.isDirty),
    label: tab.title,
    runStatement: (sql) => { void runSql(sql) },
    explainStatement: (sql) => { void explainSql(sql) },
  })
  return () => tabActions.unregister(tab.id)
}, [tab.id, tab.title, handleSave, runSql, explainSql])
```

- [ ] **Step 3: Delete the old window-event bridge**

In the same file, remove the entire `useEffect` block that registers `'nova:run-statement'` and `'nova:explain-statement'` listeners (lines around 208-225 in the current file).

- [ ] **Step 4: Verify the app still typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/tab-actions.ts src/renderer/src/components/query/QueryPanel.tsx
git commit -m "refactor(codelens): route lens run/explain through tabActions, remove window-event bridge"
```

---

### Task 6: Add lens actions to SQL/Redis/Mongo contributions and a boot-time registrar

**Files:**
- Modify: `src/renderer/src/lib/statement-contributions/sql.ts` (add `sqlStatementContribution`)
- Modify: `src/renderer/src/lib/statement-contributions/redis.ts` (add `redisStatementContribution`)
- Modify: `src/renderer/src/lib/statement-contributions/mongodb.ts` (add `mongoStatementContribution`)
- Create: `src/renderer/src/lib/statement-contributions/index.ts`

- [ ] **Step 1: Add `sqlStatementContribution` to `sql.ts`**

Append to `src/renderer/src/lib/statement-contributions/sql.ts`:

```ts
import { tabActions } from '@/stores/tab-actions'
import type { StatementContribution } from '@/lib/statement-registry'

export const sqlStatementContribution: StatementContribution = {
  splitStatements: splitSqlStatements,
  lensActions: [
    { id: 'run',     title: '▶ Run',   handler: (ctx) => tabActions.runStatement(ctx.tabId, ctx.stmt.text) },
    { id: 'explain', title: 'Explain', handler: (ctx) => tabActions.explainStatement(ctx.tabId, ctx.stmt.text) },
  ],
}
```

- [ ] **Step 2: Add `redisStatementContribution` to `redis.ts`**

Append:

```ts
import { tabActions } from '@/stores/tab-actions'
import type { StatementContribution } from '@/lib/statement-registry'

export const redisStatementContribution: StatementContribution = {
  splitStatements: splitRedisStatements,
  lensActions: [
    { id: 'run', title: '▶ Run', handler: (ctx) => tabActions.runStatement(ctx.tabId, ctx.stmt.text) },
  ],
}
```

- [ ] **Step 3: Add `mongoStatementContribution` to `mongodb.ts`**

Append:

```ts
import { tabActions } from '@/stores/tab-actions'
import type { StatementContribution } from '@/lib/statement-registry'

export const mongoStatementContribution: StatementContribution = {
  splitStatements: splitMongoStatements,
  lensActions: [
    { id: 'run', title: '▶ Run', handler: (ctx) => tabActions.runStatement(ctx.tabId, ctx.stmt.text) },
  ],
}
```

- [ ] **Step 4: Create the boot-time registrar**

```ts
// src/renderer/src/lib/statement-contributions/index.ts
/**
 * Registers built-in statement contributions for the DB types that ship with
 * the app. Called once at renderer boot. Plugins can register additional
 * contributions later by importing registerStatementContribution directly.
 */
import { registerStatementContribution } from '@/lib/statement-registry'
import { sqlStatementContribution } from './sql'
import { redisStatementContribution } from './redis'
import { mongoStatementContribution } from './mongodb'

export function registerBuiltinStatementContributions(): void {
  for (const t of ['postgresql', 'mysql', 'sqlite', 'snowflake']) {
    registerStatementContribution(t, sqlStatementContribution)
  }
  registerStatementContribution('redis', redisStatementContribution)
  registerStatementContribution('mongodb', mongoStatementContribution)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/statement-contributions/
git commit -m "feat(codelens): add built-in statement contributions for SQL/Redis/Mongo"
```

---

### Task 7: Editor registry — switch to map keyed by tabId + add `getByModelUri`

**Files:**
- Modify: `src/renderer/src/stores/editor.ts`

- [ ] **Step 1: Rewrite the registry to track every mounted editor**

Replace the body of `src/renderer/src/stores/editor.ts` with:

```ts
/**
 * Active-editor registry.
 *
 * Tracks every mounted query editor by tabId. Other UI (palette, run-selection,
 * CodeLens provider) pulls editors out either by "currently focused" (the most
 * recently registered) or by model URI (CodeLens needs to map a model Monaco
 * hands it back to the originating tab).
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface Registered {
  editor: editor.IStandaloneCodeEditor
  monaco: Monaco
  tabId: string
}

const byTab = new Map<string, Registered>()
let mostRecentTabId: string | null = null
const listeners = new Set<() => void>()

function notify() { for (const l of listeners) l() }

export const editorRegistry = {
  register(reg: Registered) {
    byTab.set(reg.tabId, reg)
    mostRecentTabId = reg.tabId
    notify()
  },
  unregister(tabId: string) {
    byTab.delete(tabId)
    if (mostRecentTabId === tabId) mostRecentTabId = null
    notify()
  },
  get(): Registered | null {
    if (!mostRecentTabId) return null
    return byTab.get(mostRecentTabId) ?? null
  },
  /** Look up the editor that owns a given Monaco text model URI. */
  getByModelUri(uri: string): Registered | null {
    for (const r of byTab.values()) {
      const m = r.editor.getModel()
      if (m && m.uri.toString() === uri) return r
    }
    return null
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  getSelectedSql(): string {
    const cur = this.get()
    if (!cur) return ''
    const sel = cur.editor.getSelection()
    if (!sel || sel.isEmpty()) return ''
    const model = cur.editor.getModel()
    if (!model) return ''
    return model.getValueInRange(sel).trim()
  },

  listActions(): { id: string; label: string }[] {
    const cur = this.get()
    if (!cur) return []
    return cur.editor.getSupportedActions().map((a) => ({ id: a.id, label: a.label }))
  },

  runAction(id: string): void {
    const cur = this.get()
    if (!cur) return
    const action = cur.editor.getAction(id)
    if (action) void action.run()
  },
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/stores/editor.ts
git commit -m "refactor(editor): track all mounted editors in a map; add getByModelUri"
```

---

### Task 8: Rewrite `monaco-codelens.ts` as a thin Monaco shell

**Files:**
- Rewrite: `src/renderer/src/lib/monaco-codelens.ts`

- [ ] **Step 1: Replace the file with the new shell**

```ts
// src/renderer/src/lib/monaco-codelens.ts
/**
 * Monaco CodeLens shell. Owns the Monaco command + the provider; all language
 * smarts (how to split statements, which actions to offer) live in the
 * statement-registry. This file knows nothing about SQL.
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { editorRegistry } from '@/stores/editor'
import {
  getStatementContribution,
  invokeLensAction,
  type Statement,
} from '@/lib/statement-registry'

const INVOKE_COMMAND_ID = 'nova.invokeLensAction'
const registeredLangs = new Set<string>()

interface LensArgs {
  dbType: string
  actionId: string
  tabId: string
  connectionId: string | null
  stmt: Statement
}

/**
 * Registers the single dispatch command. Monaco's command registry accepts
 * re-registration silently, so safe to call on every editor mount (HMR-safe).
 */
export function installCodeLensCommand(monaco: Monaco): void {
  const reg = (monaco as unknown as {
    editor: { registerCommand?: (id: string, handler: (...args: unknown[]) => void) => void }
  }).editor.registerCommand
  if (typeof reg !== 'function') return
  reg(INVOKE_COMMAND_ID, (..._args: unknown[]) => {
    // Monaco passes (accessor, ...lensArgs). We only need the trailing payload.
    const payload = _args[1] as LensArgs | undefined
    if (!payload) return
    invokeLensAction(payload.dbType, payload.actionId, {
      stmt: payload.stmt,
      tabId: payload.tabId,
      connectionId: payload.connectionId,
      dbType: payload.dbType,
    })
  })
}

/** Registers the provider against the given Monaco language id. Idempotent. */
export function registerCodeLensProviderForLanguage(monaco: Monaco, language: string): void {
  if (registeredLangs.has(language)) return
  registeredLangs.add(language)

  monaco.languages.registerCodeLensProvider(language, {
    provideCodeLenses(model: editor.ITextModel): languages.ProviderResult<languages.CodeLensList> {
      const reg = editorRegistry.getByModelUri(model.uri.toString())
      if (!reg) return { lenses: [], dispose: () => {} }
      const tab = useTabsStore.getState().tabs.find((t) => t.id === reg.tabId)
      if (!tab || tab.type !== 'query') return { lenses: [], dispose: () => {} }
      const connectionId = tab.connectionId
      if (!connectionId) return { lenses: [], dispose: () => {} }
      const dbType = useConnectionsStore.getState().connections.find((c) => c.id === connectionId)?.type
      if (!dbType) return { lenses: [], dispose: () => {} }
      const contribution = getStatementContribution(dbType)
      if (!contribution) return { lenses: [], dispose: () => {} }

      let stmts: Statement[]
      try {
        stmts = contribution.splitStatements(model.getValue())
      } catch (err) {
        console.warn('[codelens] splitter threw:', err)
        return { lenses: [], dispose: () => {} }
      }

      const lenses: languages.CodeLens[] = []
      for (const stmt of stmts) {
        for (const action of contribution.lensActions) {
          if (action.when && !action.when(stmt)) continue
          const payload: LensArgs = { dbType, actionId: action.id, tabId: reg.tabId, connectionId, stmt }
          lenses.push({
            range: {
              startLineNumber: stmt.startLine,
              startColumn: stmt.startColumn,
              endLineNumber: stmt.endLine,
              endColumn: stmt.endColumn,
            },
            id: `${action.id}-${stmt.startLine}-${stmt.startColumn}`,
            command: { id: INVOKE_COMMAND_ID, title: action.title, arguments: [payload] },
          })
        }
      }
      return { lenses, dispose: () => {} }
    },
    resolveCodeLens(_model, lens) { return lens },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/lib/monaco-codelens.ts
git commit -m "refactor(codelens): thin Monaco shell — all language smarts move to contributions"
```

---

### Task 9: Wire `QueryEditor.tsx` to the new shell

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`

- [ ] **Step 1: Update imports and the mount handler**

In `QueryEditor.tsx`, change the import line:

```ts
import { registerSqlCodeLens, installSqlCodeLensCommandHandlers } from '@/lib/monaco-codelens'
```

to:

```ts
import { installCodeLensCommand, registerCodeLensProviderForLanguage } from '@/lib/monaco-codelens'
```

- [ ] **Step 2: Replace the conditional registration**

In `handleMount`, replace this block:

```ts
if (language === 'sql') {
  installSqlCodeLensCommandHandlers(monaco)
  registerSqlCodeLens(monaco, language)
}
```

with:

```ts
installCodeLensCommand(monaco)
registerCodeLensProviderForLanguage(monaco, language)
```

(Drop the `language === 'sql'` gate — the provider itself returns no lenses for tabs whose dbType has no contribution.)

- [ ] **Step 3: Typecheck and run unit tests**

Run: `pnpm exec tsc --noEmit && pnpm test -- --run tests/unit`
Expected: no TS errors; all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx
git commit -m "feat(codelens): register Monaco provider for every editor language"
```

---

### Task 10: Boot-time registration in `App.tsx`

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add the import and one-shot call**

At the top of `App.tsx` add:

```ts
import { registerBuiltinStatementContributions } from '@/lib/statement-contributions'
```

Find the existing module-level setup or the topmost `useEffect` in `App`. Add **a module-scoped** invocation (idempotent — re-registration replaces in the registry, safe for HMR):

```ts
registerBuiltinStatementContributions()
```

Place it directly under the imports, at module top level, so it runs exactly once when the renderer module initialises.

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(codelens): register built-in statement contributions at boot"
```

---

### Task 11: Sweep for old references (clean break)

- [ ] **Step 1: Verify no old symbols or events remain**

Run each grep — every command must return zero matches:

```bash
grep -rn "nova:run-statement" src/        # expected: no matches
grep -rn "nova:explain-statement" src/    # expected: no matches
grep -rn "SqlCodeLensEvents" src/         # expected: no matches
grep -rn "installSqlCodeLensCommandHandlers" src/  # expected: no matches
grep -rn "registerSqlCodeLens\b" src/     # expected: no matches
grep -rn "manara.runStatement\|manara.explainStatement" src/  # expected: no matches
```

- [ ] **Step 2: If any matches found, delete or rewrite those call sites**

For each match, either remove the dead reference or rewrite it to use the new API (`installCodeLensCommand`, `registerCodeLensProviderForLanguage`, `tabActions.runStatement`, `tabActions.explainStatement`). After fixes, re-run the greps until they all return zero.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test -- --run`
Expected: PASS.

- [ ] **Step 4: Commit (only if step 2 produced changes)**

```bash
git add -A
git commit -m "chore(codelens): remove dead references to old SQL CodeLens API"
```

---

### Task 12: Storybook story — verify three lens stacks render

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.stories.tsx`

- [ ] **Step 1: Add a multi-statement story**

Open the file and add a new exported story (alongside existing ones). It should render `QueryEditor` with `databaseType="postgresql"` (or the equivalent SQL-typed connection used by other stories in this file), `value` set to:

```ts
const MULTI_STATEMENT_VALUE = [
  'SELECT 1;',
  'SELECT 2',
  'INSERT INTO t (a) VALUES (1)',
].join('\n')
```

Mirror the props pattern of the existing default story. The story body itself is just the `<QueryEditor … value={MULTI_STATEMENT_VALUE} … />`. No play function — visual inspection in Storybook is the verification.

- [ ] **Step 2: Verify in Storybook**

Run: `pnpm storybook`
Open the new story. Confirm three distinct `▶ Run | Explain` lens stacks appear above lines 1, 2, and 3.

- [ ] **Step 3: Run the Storybook test suite**

Run: `pnpm test -- --run`
Expected: PASS (Storybook tests included).

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.stories.tsx
git commit -m "test(codelens): story with multiple statements verifies separate lens stacks"
```

---

### Task 13: Manual verification

- [ ] **Step 1: Run the app and exercise the bug case**

Run: `pnpm dev`

In a Postgres tab, paste:

```sql
SELECT 1;
SELECT 2
INSERT INTO whatever (x) VALUES (1)
```

Confirm three `▶ Run | Explain` lens stacks appear (one above each statement). Click each `▶ Run` and confirm only that statement executes. Click `Explain` on the first and confirm the plan view opens.

Switch to a MongoDB connection (any saved profile). Paste two `{"find":"x"}` docs on separate lines. Confirm two `▶ Run` lenses appear (no `Explain`).

Switch to Redis. Paste two `GET foo` lines. Confirm two `▶ Run` lenses appear.

- [ ] **Step 2: Final commit (only if any tweaks were needed during manual QA)**

If steps in this task surfaced changes:

```bash
git add -A
git commit -m "fix(codelens): manual-QA tweaks"
```

If no changes, skip the commit.

---

## Verification checklist (run before marking the plan complete)

- [ ] `pnpm test -- --run` — green.
- [ ] `pnpm exec tsc --noEmit` — green.
- [ ] All greps in Task 11 step 1 return zero matches.
- [ ] Manual QA in Task 13 passes for Postgres, Mongo, Redis.
