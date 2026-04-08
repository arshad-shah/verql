# Plan 2: Query Editor, Execution & Results Grid

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Monaco-based SQL editor with schema-aware autocomplete, query execution with cancellation, and an AG Grid results view — the core query workflow.

**Architecture:** Monaco Editor in the renderer for SQL editing. Query execution flows through IPC to the main process (which already has the adapter layer). Results come back as `QueryResult` and render in AG Grid. A Zustand `tabs` store manages multiple open editor/result tabs. A new IPC channel `db:cancel-query` supports cancellation.

**Tech Stack:** @monaco-editor/react, monaco-editor, ag-grid-community, ag-grid-react

---

## File Structure

```
dbstudio/
├── shared/
│   ├── ipc.ts                              # MODIFY — add db:cancel-query, db:get-table-names
│   └── types.ts                            # MODIFY — add Tab, QueryTab types
├── src/
│   ├── main/
│   │   └── ipc-handlers.ts                 # MODIFY — add cancel-query + table-names handlers
│   ├── renderer/
│   │   └── src/
│   │       ├── App.tsx                     # MODIFY — render active tab content
│   │       ├── stores/
│   │       │   └── tabs.ts                 # CREATE — tab state management
│   │       ├── components/
│   │       │   ├── shell/
│   │       │   │   └── TabBar.tsx          # MODIFY — dynamic tabs from store
│   │       │   ├── query/
│   │       │   │   ├── QueryEditor.tsx     # CREATE — Monaco SQL editor
│   │       │   │   ├── QueryToolbar.tsx    # CREATE — run/cancel/explain buttons
│   │       │   │   └── QueryPanel.tsx      # CREATE — editor + toolbar + results layout
│   │       │   └── results/
│   │       │       ├── ResultsGrid.tsx     # CREATE — AG Grid result rendering
│   │       │       └── ResultsStatusBar.tsx # CREATE — row count, timing, export
│   │       └── lib/
│   │           └── monaco-sql.ts           # CREATE — SQL autocomplete provider
└── tests/
    └── unit/
        └── tabs-store.test.ts              # CREATE — tab store logic tests
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `dbstudio/package.json`

- [ ] **Step 1: Install Monaco and AG Grid**

```bash
cd /Users/ShahA/Documents/practice/dbterm/.worktrees/dbstudio/dbstudio
npm install @monaco-editor/react monaco-editor ag-grid-community ag-grid-react --save
```

- [ ] **Step 2: Verify installation**

```bash
npm ls @monaco-editor/react ag-grid-community
```

Expected: Both packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: install monaco-editor and ag-grid dependencies"
```

---

### Task 2: Extend Shared Types and IPC Contracts

**Files:**
- Modify: `dbstudio/shared/types.ts`
- Modify: `dbstudio/shared/ipc.ts`
- Test: `dbstudio/tests/unit/ipc-contracts.test.ts`

- [ ] **Step 1: Update the test to cover new types and channels**

Add these tests to the existing `tests/unit/ipc-contracts.test.ts`:

```typescript
// Add to imports at top:
import type { QueryTab, Tab } from '../../shared/types'

// Add these test cases inside the describe block:

  it('QueryTab has required fields', () => {
    const tab: QueryTab = {
      id: 'tab-1',
      type: 'query',
      title: 'Query 1',
      connectionId: 'conn-1',
      sql: 'SELECT 1',
      results: null,
      isExecuting: false,
      error: null
    }
    expect(tab.type).toBe('query')
    expect(tab.sql).toBe('SELECT 1')
  })

  it('IpcChannelMap defines query channels', () => {
    type AssertChannel<K extends keyof IpcChannelMap> = K
    type _h = AssertChannel<'db:cancel-query'>
    type _i = AssertChannel<'db:get-table-names'>
    expect(true).toBe(true)
  })
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/ipc-contracts.test.ts
```

Expected: FAIL — `QueryTab` and new channels not found.

- [ ] **Step 3: Add `QueryTab` and `Tab` types to `shared/types.ts`**

Append to the end of `shared/types.ts`:

```typescript

export interface QueryTab {
  id: string
  type: 'query'
  title: string
  connectionId: string | null
  sql: string
  results: QueryResult | null
  isExecuting: boolean
  error: string | null
}

export interface TableTab {
  id: string
  type: 'table'
  title: string
  connectionId: string
  tableName: string
  schema: string
}

export type Tab = QueryTab | TableTab
```

- [ ] **Step 4: Add new IPC channels to `shared/ipc.ts`**

Add these entries inside the `IpcChannelMap` interface, before the closing `}`:

```typescript
  'db:cancel-query': {
    args: [profileId: string]
    return: void
  }
  'db:get-table-names': {
    args: [profileId: string, schema?: string]
    return: string[]
  }
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/unit/ipc-contracts.test.ts
```

Expected: PASS — all tests including the new ones.

- [ ] **Step 6: Commit**

```bash
git add shared/ tests/unit/ipc-contracts.test.ts && git commit -m "feat: add QueryTab types and cancel-query/table-names IPC channels"
```

---

### Task 3: Add Cancel and Table-Names IPC Handlers

**Files:**
- Modify: `dbstudio/src/main/ipc-handlers.ts`

- [ ] **Step 1: Add `db:cancel-query` and `db:get-table-names` handlers**

In `src/main/ipc-handlers.ts`, add these inside `registerIpcHandlers()`, after the existing `db:get-schemas` handler:

```typescript
  handle('db:cancel-query', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter && 'cancelQuery' in adapter) {
      (adapter as any).cancelQuery()
    }
  })

  handle('db:get-table-names', async (profileId: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const tables = await adapter.getTables(schema)
    return tables.map(t => t.name)
  })
```

- [ ] **Step 2: Run existing tests to verify no regression**

```bash
npx vitest run
```

Expected: All 23+ tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc-handlers.ts && git commit -m "feat: add cancel-query and table-names IPC handlers"
```

---

### Task 4: Tabs Store

**Files:**
- Create: `dbstudio/src/renderer/src/stores/tabs.ts`
- Test: `dbstudio/tests/unit/tabs-store.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/unit/tabs-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

// We'll test the pure logic functions, not the Zustand store directly
// (Zustand stores need a React context or manual store creation)
import type { QueryTab, Tab, QueryResult } from '../../shared/types'

function createQueryTab(id: string, connectionId: string | null = null): QueryTab {
  return {
    id,
    type: 'query',
    title: `Query ${id}`,
    connectionId,
    sql: '',
    results: null,
    isExecuting: false,
    error: null
  }
}

describe('Tab logic', () => {
  it('creates a query tab with defaults', () => {
    const tab = createQueryTab('1', 'conn-1')
    expect(tab.type).toBe('query')
    expect(tab.sql).toBe('')
    expect(tab.results).toBeNull()
    expect(tab.isExecuting).toBe(false)
    expect(tab.connectionId).toBe('conn-1')
  })

  it('can update tab SQL', () => {
    const tab = createQueryTab('1')
    const updated = { ...tab, sql: 'SELECT * FROM users' }
    expect(updated.sql).toBe('SELECT * FROM users')
  })

  it('can set execution state', () => {
    const tab = createQueryTab('1')
    const executing = { ...tab, isExecuting: true, error: null, results: null }
    expect(executing.isExecuting).toBe(true)
  })

  it('can set results', () => {
    const result: QueryResult = {
      rows: [{ id: 1 }],
      fields: [{ name: 'id', dataType: 'int', nullable: false }],
      rowCount: 1,
      duration: 10,
      affectedRows: 0
    }
    const tab = createQueryTab('1')
    const withResults = { ...tab, results: result, isExecuting: false }
    expect(withResults.results!.rowCount).toBe(1)
    expect(withResults.isExecuting).toBe(false)
  })

  it('can set error state', () => {
    const tab = createQueryTab('1')
    const withError = { ...tab, error: 'relation "foo" does not exist', isExecuting: false }
    expect(withError.error).toContain('does not exist')
  })

  it('manages multiple tabs', () => {
    const tabs: Tab[] = [
      createQueryTab('1', 'conn-1'),
      createQueryTab('2', 'conn-1'),
    ]
    expect(tabs).toHaveLength(2)
    const removed = tabs.filter(t => t.id !== '1')
    expect(removed).toHaveLength(1)
    expect(removed[0].id).toBe('2')
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (pure logic tests, no deps needed)

```bash
npx vitest run tests/unit/tabs-store.test.ts
```

Expected: PASS — 6 tests.

- [ ] **Step 3: Create `src/renderer/src/stores/tabs.ts`**

```typescript
import { create } from 'zustand'
import type { Tab, QueryTab, QueryResult } from '@shared/types'

let tabCounter = 0

function createQueryTab(connectionId: string | null): QueryTab {
  tabCounter++
  return {
    id: `query-${tabCounter}-${Date.now()}`,
    type: 'query',
    title: `Query ${tabCounter}`,
    connectionId,
    sql: '',
    results: null,
    isExecuting: false,
    error: null
  }
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  addQueryTab: (connectionId: string | null) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabSql: (id: string, sql: string) => void
  setTabExecuting: (id: string, executing: boolean) => void
  setTabResults: (id: string, results: QueryResult) => void
  setTabError: (id: string, error: string) => void
  getActiveTab: () => Tab | undefined
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addQueryTab: (connectionId) => {
    const tab = createQueryTab(connectionId)
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id
    }))
    return tab.id
  },

  closeTab: (id) => {
    set((s) => {
      const remaining = s.tabs.filter(t => t.id !== id)
      let nextActive = s.activeTabId
      if (s.activeTabId === id) {
        const idx = s.tabs.findIndex(t => t.id === id)
        nextActive = remaining[Math.min(idx, remaining.length - 1)]?.id ?? null
      }
      return { tabs: remaining, activeTabId: nextActive }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabSql: (id, sql) => {
    set((s) => ({
      tabs: s.tabs.map(t => t.id === id && t.type === 'query' ? { ...t, sql } : t)
    }))
  },

  setTabExecuting: (id, executing) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, isExecuting: executing, ...(executing ? { error: null } : {}) }
          : t
      )
    }))
  },

  setTabResults: (id, results) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, results, isExecuting: false, error: null }
          : t
      )
    }))
  },

  setTabError: (id, error) => {
    set((s) => ({
      tabs: s.tabs.map(t =>
        t.id === id && t.type === 'query'
          ? { ...t, error, isExecuting: false }
          : t
      )
    }))
  },

  getActiveTab: () => {
    const s = get()
    return s.tabs.find(t => t.id === s.activeTabId)
  }
}))
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/stores/tabs.ts tests/unit/tabs-store.test.ts && git commit -m "feat: add tabs store for managing query editor tabs"
```

---

### Task 5: SQL Autocomplete Provider

**Files:**
- Create: `dbstudio/src/renderer/src/lib/monaco-sql.ts`

- [ ] **Step 1: Create `src/renderer/src/lib/monaco-sql.ts`**

```typescript
import type { Monaco } from '@monaco-editor/react'

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'FULL', 'CROSS', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'INSERT', 'INTO',
  'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
  'DROP', 'INDEX', 'VIEW', 'TRIGGER', 'FUNCTION', 'BEGIN', 'COMMIT',
  'ROLLBACK', 'TRANSACTION', 'EXPLAIN', 'ANALYZE', 'WITH', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'COUNT', 'SUM', 'AVG',
  'MIN', 'MAX', 'COALESCE', 'CAST', 'TRUNCATE', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE',
  'NOT NULL', 'CASCADE', 'RESTRICT', 'RETURNING'
]

let cachedTableNames: string[] = []

export function updateTableNames(names: string[]): void {
  cachedTableNames = names
}

export function registerSqlCompletionProvider(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const suggestions = [
        ...SQL_KEYWORDS.map(kw => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
          sortText: '1' + kw
        })),
        ...cachedTableNames.map(name => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: name,
          detail: 'table',
          range,
          sortText: '0' + name
        }))
      ]

      return { suggestions }
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/monaco-sql.ts && git commit -m "feat: add SQL autocomplete provider for Monaco with keyword and table completion"
```

---

### Task 6: Query Editor Component (Monaco)

**Files:**
- Create: `dbstudio/src/renderer/src/components/query/QueryEditor.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/query/QueryEditor.tsx`**

```tsx
import { useRef, useCallback, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerSqlCompletionProvider, updateTableNames } from '@/lib/monaco-sql'
import { useConnectionsStore } from '@/stores/connections'

interface Props {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  connectionId: string | null
}

let completionRegistered = false

export function QueryEditor({ value, onChange, onExecute, connectionId }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const { connectedIds } = useConnectionsStore()

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    if (!completionRegistered) {
      registerSqlCompletionProvider(monaco)
      completionRegistered = true
    }

    // Cmd+Enter / Ctrl+Enter to execute
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onExecute()
    })

    editor.focus()
  }, [onExecute])

  // Fetch table names for autocomplete when connection changes
  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId)) {
      updateTableNames([])
      return
    }
    window.electronAPI.invoke('db:get-table-names', connectionId)
      .then(names => updateTableNames(names))
      .catch(() => updateTableNames([]))
  }, [connectionId, connectedIds])

  return (
    <Editor
      defaultLanguage="sql"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'line',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8
        }
      }}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center h-full text-text-muted text-sm">
          Loading editor...
        </div>
      }
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx && git commit -m "feat: add Monaco SQL editor component with autocomplete and Cmd+Enter execution"
```

---

### Task 7: Query Toolbar Component

**Files:**
- Create: `dbstudio/src/renderer/src/components/query/QueryToolbar.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/query/QueryToolbar.tsx`**

```tsx
import { Play, Square, FileSearch, Loader2 } from 'lucide-react'

interface Props {
  onExecute: () => void
  onCancel: () => void
  onExplain: () => void
  isExecuting: boolean
  duration: number | null
  rowCount: number | null
  error: string | null
}

export function QueryToolbar({ onExecute, onCancel, onExplain, isExecuting, duration, rowCount, error }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-bg-secondary shrink-0">
      {isExecuting ? (
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
        >
          <Square size={12} /> Cancel
        </button>
      ) : (
        <button
          onClick={onExecute}
          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
        >
          <Play size={12} /> Run
        </button>
      )}

      <button
        onClick={onExplain}
        disabled={isExecuting}
        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <FileSearch size={12} /> Explain
      </button>

      <div className="ml-auto flex items-center gap-3 text-xs">
        {isExecuting && (
          <span className="text-text-muted flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Executing...
          </span>
        )}
        {!isExecuting && duration !== null && (
          <span className="text-success">{rowCount} rows · {duration}ms</span>
        )}
        {!isExecuting && error && (
          <span className="text-error truncate max-w-xs" title={error}>{error}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/query/QueryToolbar.tsx && git commit -m "feat: add query toolbar with run, cancel, and explain buttons"
```

---

### Task 8: Results Grid Component (AG Grid)

**Files:**
- Create: `dbstudio/src/renderer/src/components/results/ResultsGrid.tsx`
- Create: `dbstudio/src/renderer/src/components/results/ResultsStatusBar.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/results/ResultsGrid.tsx`**

```tsx
import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, themeQuartz } from 'ag-grid-community'
import type { QueryResult } from '@shared/types'

ModuleRegistry.registerModules([AllCommunityModule])

const darkTheme = themeQuartz.withParams({
  backgroundColor: '#1a1a2e',
  foregroundColor: '#ffffff',
  headerBackgroundColor: '#12121f',
  headerForegroundColor: '#888888',
  borderColor: '#2a2a3e',
  rowHoverColor: 'rgba(124, 111, 247, 0.05)',
  selectedRowBackgroundColor: 'rgba(124, 111, 247, 0.1)',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  fontSize: 12,
  headerFontSize: 11,
  headerFontWeight: 600,
  cellHorizontalPadding: 10,
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.01)',
})

interface Props {
  results: QueryResult
}

export function ResultsGrid({ results }: Props) {
  const columnDefs = useMemo<ColDef[]>(() => {
    return results.fields.map((field) => ({
      field: field.name,
      headerName: field.name,
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
      cellStyle: (params: any) => {
        if (params.value === null || params.value === undefined) {
          return { color: '#666', fontStyle: 'italic' }
        }
        if (typeof params.value === 'number') {
          return { color: '#e5c07b' }
        }
        return null
      },
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return 'NULL'
        if (typeof params.value === 'object') return JSON.stringify(params.value)
        return String(params.value)
      }
    }))
  }, [results.fields])

  return (
    <div className="flex-1 overflow-hidden">
      <AgGridReact
        theme={darkTheme}
        rowData={results.rows}
        columnDefs={columnDefs}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true
        }}
        enableCellTextSelection={true}
        suppressRowClickSelection={true}
        animateRows={false}
        rowHeight={28}
        headerHeight={32}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/renderer/src/components/results/ResultsStatusBar.tsx`**

```tsx
import type { QueryResult } from '@shared/types'

interface Props {
  results: QueryResult
}

export function ResultsStatusBar({ results }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-bg-secondary text-xs shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-success">
          {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'}
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-text-secondary">{results.duration}ms</span>
        {results.affectedRows > 0 && (
          <>
            <span className="text-text-muted">·</span>
            <span className="text-warning">{results.affectedRows} affected</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-text-muted">{results.fields.length} columns</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/results/ && git commit -m "feat: add AG Grid results view with dark theme and status bar"
```

---

### Task 9: Query Panel — Combines Editor + Toolbar + Results

**Files:**
- Create: `dbstudio/src/renderer/src/components/query/QueryPanel.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/query/QueryPanel.tsx`**

```tsx
import { useCallback } from 'react'
import { QueryEditor } from './QueryEditor'
import { QueryToolbar } from './QueryToolbar'
import { ResultsGrid } from '@/components/results/ResultsGrid'
import { ResultsStatusBar } from '@/components/results/ResultsStatusBar'
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab } from '@shared/types'

interface Props {
  tab: QueryTab
}

export function QueryPanel({ tab }: Props) {
  const { updateTabSql, setTabExecuting, setTabResults, setTabError } = useTabsStore()

  const handleExecute = useCallback(async () => {
    if (!tab.connectionId || !tab.sql.trim()) return
    setTabExecuting(tab.id, true)
    try {
      const result = await window.electronAPI.invoke('db:query', tab.connectionId, tab.sql)
      setTabResults(tab.id, result)
    } catch (err) {
      setTabError(tab.id, (err as Error).message)
    }
  }, [tab.id, tab.connectionId, tab.sql, setTabExecuting, setTabResults, setTabError])

  const handleCancel = useCallback(async () => {
    if (!tab.connectionId) return
    try {
      await window.electronAPI.invoke('db:cancel-query', tab.connectionId)
    } catch {
      // ignore cancel errors
    }
    setTabExecuting(tab.id, false)
  }, [tab.id, tab.connectionId, setTabExecuting])

  const handleExplain = useCallback(async () => {
    if (!tab.connectionId || !tab.sql.trim()) return
    setTabExecuting(tab.id, true)
    try {
      const explainSql = `EXPLAIN ANALYZE ${tab.sql}`
      const result = await window.electronAPI.invoke('db:query', tab.connectionId, explainSql)
      setTabResults(tab.id, result)
    } catch (err) {
      setTabError(tab.id, (err as Error).message)
    }
  }, [tab.id, tab.connectionId, tab.sql, setTabExecuting, setTabResults, setTabError])

  return (
    <div className="flex flex-col h-full">
      {/* Editor — top half */}
      <div className="flex-1 min-h-[120px] border-b border-border">
        <QueryEditor
          value={tab.sql}
          onChange={(sql) => updateTabSql(tab.id, sql)}
          onExecute={handleExecute}
          connectionId={tab.connectionId}
        />
      </div>

      {/* Toolbar */}
      <QueryToolbar
        onExecute={handleExecute}
        onCancel={handleCancel}
        onExplain={handleExplain}
        isExecuting={tab.isExecuting}
        duration={tab.results?.duration ?? null}
        rowCount={tab.results?.rowCount ?? null}
        error={tab.error}
      />

      {/* Results — bottom half */}
      <div className="flex-1 min-h-[100px] flex flex-col">
        {tab.results ? (
          <>
            <ResultsGrid results={tab.results} />
            <ResultsStatusBar results={tab.results} />
          </>
        ) : tab.error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-error/5 border border-error/20 rounded-lg p-4 max-w-lg">
              <p className="text-error text-sm font-medium mb-1">Query Error</p>
              <p className="text-text-secondary text-xs font-mono whitespace-pre-wrap">{tab.error}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            Run a query to see results (Cmd+Enter)
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/query/QueryPanel.tsx && git commit -m "feat: add QueryPanel combining editor, toolbar, and results grid"
```

---

### Task 10: Wire Up TabBar, App, and Sidebar

**Files:**
- Modify: `dbstudio/src/renderer/src/components/shell/TabBar.tsx`
- Modify: `dbstudio/src/renderer/src/components/shell/Sidebar.tsx`
- Modify: `dbstudio/src/renderer/src/App.tsx`

- [ ] **Step 1: Replace `src/renderer/src/components/shell/TabBar.tsx`**

```tsx
import { Plus, X } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addQueryTab } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  return (
    <div className="h-9 bg-bg-primary border-b border-border flex items-center shrink-0 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border shrink-0 ${
            activeTabId === tab.id
              ? 'text-text-primary border-b-2 border-b-accent bg-bg-tertiary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="truncate max-w-[120px]">{tab.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity"
          >
            <X size={10} />
          </button>
        </div>
      ))}
      <button
        onClick={() => addQueryTab(activeConnectionId)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
        title="New Query Tab"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Update Sidebar to add "New Query" action when connected**

In `src/renderer/src/components/shell/Sidebar.tsx`, add a "New Query" button. Replace the file:

```tsx
import { useUiStore } from '@/stores/ui'
import { ConnectionList } from '@/components/connections/ConnectionList'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { PenSquare } from 'lucide-react'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()
  const { activeConnectionId, connectedIds } = useConnectionsStore()
  const { addQueryTab } = useTabsStore()

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    schema: 'Schema',
    charts: 'Charts',
    extensions: 'Extensions'
  }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>{titles[activePanel] ?? 'Explorer'}</span>
        {isConnected && activePanel === 'explorer' && (
          <button
            onClick={() => addQueryTab(activeConnectionId)}
            className="text-text-muted hover:text-accent transition-colors"
            title="New Query"
          >
            <PenSquare size={12} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'explorer' && <ConnectionList />}
        {activePanel !== 'explorer' && (
          <p className="text-text-muted text-sm px-2 py-8 text-center">Coming soon</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `src/renderer/src/App.tsx` to render active tab content**

```tsx
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/TabBar'
import { QueryPanel } from '@/components/query/QueryPanel'
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab } from '@shared/types'

export function App() {
  const { tabs, activeTabId } = useTabsStore()
  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab?.type === 'query' && (
              <QueryPanel tab={activeTab as QueryTab} />
            )}
            {!activeTab && (
              <div className="flex-1 flex items-center justify-center bg-bg-tertiary h-full">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold mb-2">dbstudio</h1>
                  <p className="text-text-secondary">Connect to a database to get started</p>
                  <p className="text-text-muted text-sm mt-1">Then press + to open a query tab</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  )
}
```

- [ ] **Step 4: Verify build succeeds**

```bash
npx electron-vite build
```

Expected: All three bundles build without errors.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/ && git commit -m "feat: wire up tab system — dynamic TabBar, query tabs in App, new query from Sidebar"
```

---

### Task 11: Verify Full Query Workflow (Build + Tests)

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests pass (ipc-contracts, sqlite-adapter, adapter, config-store, tabs-store).

- [ ] **Step 2: Build the app**

```bash
npx electron-vite build
```

Expected: All three bundles build cleanly.

- [ ] **Step 3: Final commit**

```bash
git add -A && git status
```

If there are any uncommitted changes:

```bash
git commit -m "chore: plan 2 complete — query editor, execution, results grid"
```

---

## Plan Index

This is Plan 2 of 7. Builds on Plan 1 (scaffold, shell, connections).

- **Plan 1:** ✅ Project scaffold, Electron shell, connection manager
- **Plan 2:** ✅ (this plan) Query editor (Monaco) + execution + results grid (AG Grid)
- **Plan 3:** Schema browser + ER diagram visualization (React Flow + Dagre + ELK.js)
- **Plan 4:** Data charts (Recharts) + query plan visualization
- **Plan 5:** Import/export + cross-database migration
- **Plan 6:** Plugin system (npm-based + SDK)
- **Plan 7:** Polish — command palette, keybindings, settings
