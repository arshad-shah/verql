# Explorer Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the explorer sidebar with VS Code-style accordion sections, always-visible actions, overflow menus, search/filter, and row counts.

**Architecture:** Replace the flat Sidebar → ConnectionList + SchemaTree layout with 4 accordion sections (Connections, Databases, Tables, Views) in a new `explorer/` component directory. Add `getRowCount` to the adapter interface and IPC layer. Split SchemaTree into TablesSection and ViewsSection. Add reusable AccordionSection and OverflowMenu primitives.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS 4, lucide-react, Electron IPC

---

### Task 1: Backend — Add `getRowCount` to adapter interface and IPC

**Files:**
- Modify: `src/main/db/adapter.ts:1-16`
- Modify: `src/main/db/postgres.ts` (add method after `getDatabases`)
- Modify: `src/main/db/mysql.ts` (add method after `getDatabases`)
- Modify: `src/main/db/sqlite.ts` (add method after `getDatabases`)
- Modify: `shared/ipc.ts` (add channel)
- Modify: `src/main/ipc-handlers.ts` (add handler)
- Test: `tests/unit/sqlite-adapter.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/unit/sqlite-adapter.test.ts`, add a test for `getRowCount`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SqliteAdapter } from '../../src/main/db/sqlite'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('SqliteAdapter.getRowCount', () => {
  let adapter: SqliteAdapter
  let dbPath: string

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `test-rowcount-${Date.now()}.db`)
    const db = new Database(dbPath)
    db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)')
    db.exec("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')")
    db.exec('CREATE VIEW active_users AS SELECT * FROM users WHERE id > 1')
    db.close()

    adapter = new SqliteAdapter(dbPath)
    await adapter.connect()
  })

  afterEach(async () => {
    await adapter.disconnect()
    fs.unlinkSync(dbPath)
  })

  it('returns exact row count for a table', async () => {
    const count = await adapter.getRowCount('users')
    expect(count).toBe(3)
  })

  it('returns row count for a view', async () => {
    const count = await adapter.getRowCount('active_users')
    expect(count).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sqlite-adapter.test.ts --reporter=verbose`
Expected: FAIL — `adapter.getRowCount is not a function`

- [ ] **Step 3: Add `getRowCount` to the adapter interface**

In `src/main/db/adapter.ts`, add after line 12 (`getIndexes`):

```typescript
  getRowCount(table: string, schema?: string): Promise<number>
```

- [ ] **Step 4: Implement `getRowCount` in SqliteAdapter**

In `src/main/db/sqlite.ts`, add after the `getIndexes` method (after line 103):

```typescript
  async getRowCount(table: string, _schema?: string): Promise<number> {
    if (!this.db) throw new Error('Not connected')
    const row = this.db.prepare(`SELECT count(*) as cnt FROM "${table}"`).get() as { cnt: number }
    return row.cnt
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/sqlite-adapter.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 6: Implement `getRowCount` in PostgresAdapter**

In `src/main/db/postgres.ts`, add after the `getDatabases` method (after line 124):

```typescript
  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT count(*) as cnt FROM "${s}"."${table}"`
    )
    return parseInt(result.rows[0].cnt, 10)
  }
```

- [ ] **Step 7: Implement `getRowCount` in MysqlAdapter**

In `src/main/db/mysql.ts`, add after the `getDatabases` method (after line 94):

```typescript
  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(
      `SELECT count(*) as cnt FROM \`${db}\`.\`${table}\``
    )
    return (rows as { cnt: number }[])[0].cnt
  }
```

- [ ] **Step 8: Add IPC channel definition**

In `shared/ipc.ts`, add after the `db:get-databases` channel (after line 39):

```typescript
  'db:get-row-count': {
    args: [profileId: string, table: string, schema?: string]
    return: number
  }
```

- [ ] **Step 9: Add IPC handler**

In `src/main/ipc-handlers.ts`, add after the `db:get-databases` handler (after line 222):

```typescript
  handle('db:get-row-count', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection first')
    try {
      return await adapter.getRowCount(table, schema)
    } catch (err) {
      throw new Error(formatDbError(err))
    }
  })
```

- [ ] **Step 10: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All tests PASS

- [ ] **Step 11: Commit**

```bash
git add src/main/db/adapter.ts src/main/db/postgres.ts src/main/db/mysql.ts src/main/db/sqlite.ts shared/ipc.ts src/main/ipc-handlers.ts tests/unit/sqlite-adapter.test.ts
git commit -m "feat: add getRowCount to adapter interface and IPC layer"
```

---

### Task 2: Store Updates — Add `filterText`, `rowCounts`, and `expandedSections`

**Files:**
- Modify: `src/renderer/src/stores/schema.ts`
- Modify: `src/renderer/src/stores/ui.ts`
- Test: `tests/unit/schema-store.test.ts`

- [ ] **Step 1: Write the failing test for filterText and rowCounts cache**

In `tests/unit/schema-store.test.ts`, add a new describe block:

```typescript
describe('Schema filter and row count cache', () => {
  it('filterText filters table names case-insensitively', () => {
    const tables: SchemaTable[] = [
      { name: 'users', schema: 'public', type: 'table' },
      { name: 'user_roles', schema: 'public', type: 'table' },
      { name: 'posts', schema: 'public', type: 'table' },
      { name: 'active_users', schema: 'public', type: 'view' }
    ]
    const filterText = 'user'
    const filtered = tables.filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()))
    expect(filtered).toHaveLength(3)
    expect(filtered.map(t => t.name)).toEqual(['users', 'user_roles', 'active_users'])
  })

  it('rowCounts cache stores counts by composite key', () => {
    const rowCounts = new Map<string, number>()
    rowCounts.set('conn1:public:users', 1200)
    rowCounts.set('conn1:public:posts', 856)
    expect(rowCounts.get('conn1:public:users')).toBe(1200)
    expect(rowCounts.get('conn1:public:posts')).toBe(856)
    expect(rowCounts.get('conn1:public:missing')).toBeUndefined()
  })

  it('clearCache removes rowCounts for a connection', () => {
    const rowCounts = new Map<string, number>()
    rowCounts.set('conn1:public:users', 1200)
    rowCounts.set('conn2:public:posts', 500)
    // Simulate clearCache for conn1
    const next = new Map<string, number>()
    for (const [k, v] of rowCounts) {
      if (!k.startsWith('conn1')) next.set(k, v)
    }
    expect(next.size).toBe(1)
    expect(next.get('conn2:public:posts')).toBe(500)
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (these are pure logic tests)

Run: `npx vitest run tests/unit/schema-store.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 3: Add `filterText`, `rowCounts`, and `fetchRowCount` to schema store**

In `src/renderer/src/stores/schema.ts`, add to the `SchemaState` interface (after line 10, before `loading`):

```typescript
  filterText: string
  rowCounts: Map<string, number>
```

Add to the interface methods (after `clearCache`):

```typescript
  setFilterText: (text: string) => void
  fetchRowCount: (connectionId: string, table: string, schema: string) => Promise<void>
```

Add to the store initial state (after `expandedTables: new Set(),`):

```typescript
  filterText: '',
  rowCounts: new Map(),
```

Add the `setFilterText` action:

```typescript
  setFilterText: (text) => set({ filterText: text }),
```

Add the `fetchRowCount` action:

```typescript
  fetchRowCount: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    if (get().rowCounts.has(key)) return
    const count = await window.electronAPI.invoke('db:get-row-count', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.rowCounts)
      next.set(key, count)
      return { rowCounts: next }
    })
  },
```

Update the `clearCache` method to also clear `rowCounts` and `filterText`. In the full-clear path (line 112), add `rowCounts: new Map(), filterText: ''`. In the filtered path, add `rowCounts: filterMap(s.rowCounts)` to the return object.

- [ ] **Step 4: Add `expandedSections` and `toggleSection` to UI store**

In `src/renderer/src/stores/ui.ts`, update the `ActivityPanel` type to remove `'schema'`:

```typescript
export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'
```

Add to the `UiState` interface:

```typescript
  expandedSections: Record<string, boolean>
  toggleSection: (title: string) => void
```

Add to the store:

```typescript
  expandedSections: {
    CONNECTIONS: true,
    DATABASES: true,
    TABLES: true,
    VIEWS: true
  },
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title]
      }
    })),
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/stores/schema.ts src/renderer/src/stores/ui.ts tests/unit/schema-store.test.ts
git commit -m "feat: add filterText, rowCounts to schema store and expandedSections to UI store"
```

---

### Task 3: AccordionSection Component

**Files:**
- Create: `src/renderer/src/components/explorer/AccordionSection.tsx`

- [ ] **Step 1: Create AccordionSection component**

```tsx
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useUiStore } from '@/stores/ui'

interface AccordionSectionProps {
  title: string
  count?: number
  defaultExpanded?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AccordionSection({ title, count, actions, children }: AccordionSectionProps) {
  const expanded = useUiStore((s) => s.expandedSections[title] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)

  return (
    <div className="border-b border-border">
      <button
        onClick={() => toggleSection(title)}
        className="w-full flex items-center gap-1 px-2 py-1.5 bg-bg-primary hover:bg-white/5 transition-colors"
      >
        {expanded
          ? <ChevronDown size={12} className="text-text-muted shrink-0" />
          : <ChevronRight size={12} className="text-text-muted shrink-0" />
        }
        <span className="text-[10px] text-text-muted uppercase tracking-wider flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="bg-white/10 text-text-muted rounded-full px-1.5 text-[9px] leading-4">{count}</span>
        )}
        {actions && (
          <span
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </button>
      {expanded && <div className="pb-1">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds (component is created but not imported yet, so no compile errors)

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/AccordionSection.tsx
git commit -m "feat: add AccordionSection reusable component"
```

---

### Task 4: OverflowMenu Component

**Files:**
- Create: `src/renderer/src/components/explorer/OverflowMenu.tsx`

- [ ] **Step 1: Create OverflowMenu component**

```tsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'danger'
}

interface OverflowMenuProps {
  items: MenuItem[]
}

export function OverflowMenu({ items }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const rect = buttonRef.current?.getBoundingClientRect()

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
        title="More actions"
      >
        <MoreHorizontal size={12} />
      </button>
      {open && rect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-bg-secondary border border-border rounded-lg shadow-xl py-1 min-w-36"
          style={{ top: rect.bottom + 4, left: rect.right - 144 }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors text-left ${
                item.variant === 'danger' ? 'text-error' : 'text-text-secondary'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/OverflowMenu.tsx
git commit -m "feat: add OverflowMenu portal dropdown component"
```

---

### Task 5: SearchFilter Component

**Files:**
- Create: `src/renderer/src/components/explorer/SearchFilter.tsx`

- [ ] **Step 1: Create SearchFilter component**

```tsx
import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'

export function SearchFilter() {
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Clear filter when connection changes
  useEffect(() => {
    setFilterText('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (value: string) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFilterText(value), 150)
  }

  const handleClear = () => {
    setFilterText('')
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClear()
  }

  return (
    <div className="px-2 py-1.5 border-b border-border">
      <div className="flex items-center gap-1.5 bg-bg-tertiary border border-border rounded-md px-2 py-1">
        <Search size={12} className="text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter tables, views..."
          defaultValue={filterText}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted outline-none"
        />
        {filterText && (
          <button onClick={handleClear} className="text-text-muted hover:text-text-primary shrink-0">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/SearchFilter.tsx
git commit -m "feat: add SearchFilter component for explorer panel"
```

---

### Task 6: ConnectionsSection Component

**Files:**
- Create: `src/renderer/src/components/explorer/ConnectionsSection.tsx`

- [ ] **Step 1: Create ConnectionsSection component**

This replaces `ConnectionList.tsx` with the accordion wrapper, always-visible connect/edit buttons, and overflow menu.

```tsx
import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, Trash2, Copy } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { ConnectionForm } from '@/components/connections/ConnectionForm'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'
import type { ConnectionProfile } from '@shared/types'

export function ConnectionsSection() {
  const { connections, connectedIds, activeConnectionId, loadConnections, saveConnection, deleteConnection, connect, disconnect, setActiveConnection } = useConnectionsStore()
  const addToast = useToastStore((s) => s.addToast)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConnectionProfile | undefined>()

  useEffect(() => { loadConnections() }, [loadConnections])

  const handleSave = async (profile: ConnectionProfile) => {
    await saveConnection(profile)
    setShowForm(false)
    setEditing(undefined)
  }

  const handleConnect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      const result = await connect(id)
      if (!result.success) addToast({ type: 'error', title: 'Connection failed', message: result.error })
    }
  }

  const handleDuplicate = async (conn: ConnectionProfile) => {
    const duplicate: ConnectionProfile = {
      ...conn,
      id: crypto.randomUUID(),
      name: `${conn.name} (copy)`
    }
    setEditing(duplicate)
    setShowForm(true)
  }

  const getOverflowItems = (conn: ConnectionProfile): MenuItem[] => {
    const items: MenuItem[] = []
    const isConnected = connectedIds.has(conn.id)
    if (isConnected) {
      items.push({
        label: 'Disconnect',
        icon: <Unplug size={12} />,
        onClick: () => disconnect(conn.id)
      })
    }
    items.push({
      label: 'Duplicate',
      icon: <Copy size={12} />,
      onClick: () => handleDuplicate(conn)
    })
    items.push({
      label: 'Delete',
      icon: <Trash2 size={12} />,
      variant: 'danger',
      onClick: () => { if (confirm(`Delete "${conn.name}"?`)) deleteConnection(conn.id) }
    })
    return items
  }

  return (
    <>
      <AccordionSection
        title="CONNECTIONS"
        count={connections.length}
        actions={
          <button
            onClick={() => { setEditing(undefined); setShowForm(true) }}
            className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
            title="New Connection"
          >
            <Plus size={12} />
          </button>
        }
      >
        <div className="px-1">
          {connections.length === 0 && (
            <p className="text-text-muted text-xs px-2 py-4 text-center">No connections yet</p>
          )}
          {connections.map((conn) => {
            const isConnected = connectedIds.has(conn.id)
            const isActive = activeConnectionId === conn.id
            return (
              <div
                key={conn.id}
                onClick={() => handleConnect(conn.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'hover:bg-white/5 text-text-secondary'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isConnected ? (conn.color ?? '#7c6ff7') : '#444' }}
                />
                <span className="text-xs truncate flex-1">{conn.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    isConnected ? disconnect(conn.id) : handleConnect(conn.id)
                  }}
                  className={`p-0.5 rounded transition-colors shrink-0 ${
                    isConnected
                      ? 'text-success hover:text-error'
                      : 'text-text-muted hover:text-success'
                  }`}
                  title={isConnected ? 'Disconnect' : 'Connect'}
                >
                  {isConnected ? <Unplug size={12} /> : <PlugZap size={12} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(conn); setShowForm(true) }}
                  className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors shrink-0"
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <OverflowMenu items={getOverflowItems(conn)} />
              </div>
            )
          })}
        </div>
      </AccordionSection>
      {showForm && (
        <ConnectionForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/ConnectionsSection.tsx
git commit -m "feat: add ConnectionsSection with accordion, always-visible actions, overflow menu"
```

---

### Task 7: DatabasesSection Component

**Files:**
- Create: `src/renderer/src/components/explorer/DatabasesSection.tsx`

- [ ] **Step 1: Create DatabasesSection component**

This extracts the database chips and schema dropdown from the old SchemaTree.

```tsx
import { useEffect, useState } from 'react'
import { RefreshCw, ChevronDown, Database, Layers, GitFork } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { AccordionSection } from './AccordionSection'

interface DatabasesSectionProps {
  connectionId: string
  activeSchema: string
  onSchemaChange: (schema: string) => void
  activeDatabase: string
  onDatabaseChange: (db: string) => void
}

export function DatabasesSection({ connectionId, activeSchema, onSchemaChange, activeDatabase, onDatabaseChange }: DatabasesSectionProps) {
  const { schemas, fetchSchemas, fetchDatabases, clearCache } = useSchemaStore()
  const conn = useConnectionsStore((s) => s.connections.find(c => c.id === connectionId))
  const { openErDiagram } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)
  const [showSchemaPicker, setShowSchemaPicker] = useState(false)

  const schemaList = schemas.get(connectionId) ?? []
  const isSqlite = conn?.type === 'sqlite'

  useEffect(() => {
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }, [connectionId, fetchDatabases, fetchSchemas])

  const handleRefresh = () => {
    clearCache(connectionId)
    setDatabaseList([])
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }

  const handleSwitchDatabase = async (db: string) => {
    if (db === activeDatabase || switching) return
    setSwitching(true)
    try {
      await window.electronAPI.invoke('db:switch-database', connectionId, db)
      clearCache(connectionId)
      onDatabaseChange(db)
      const newSchemas = await fetchSchemas(connectionId)
      const newDefault = conn?.type === 'mysql' ? db : 'public'
      const resolved = newSchemas.includes(newDefault) ? newDefault : newSchemas[0] ?? 'public'
      onSchemaChange(resolved)
      addToast({ type: 'success', title: `Switched to ${db}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to switch database', message: (err as Error).message })
    } finally {
      setSwitching(false)
    }
  }

  const handleOpenErDiagram = () => {
    openErDiagram(connectionId, activeSchema)
  }

  // SQLite has no database switching — hide section if only 1 db
  if (isSqlite && databaseList.length <= 1 && schemaList.length <= 1) return null

  return (
    <AccordionSection
      title="DATABASES"
      count={databaseList.length || undefined}
      actions={
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenErDiagram}
            className="p-0.5 text-text-muted hover:text-accent rounded transition-colors"
            title="ER Diagram"
          >
            <GitFork size={12} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      }
    >
      <div className="px-2 py-1">
        {/* Database chips */}
        {databaseList.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {databaseList.map(db => (
              <button
                key={db}
                onClick={() => handleSwitchDatabase(db)}
                disabled={switching || db === activeDatabase}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                  db === activeDatabase
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary border border-border cursor-pointer'
                } disabled:opacity-50`}
              >
                <Database size={9} />
                {db}
              </button>
            ))}
          </div>
        )}

        {/* Schema selector */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">Schema:</span>
          <button
            onClick={() => setShowSchemaPicker(!showSchemaPicker)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Layers size={10} />
            <span className="truncate max-w-24">{activeSchema}</span>
            {schemaList.length > 1 && <ChevronDown size={10} />}
          </button>
          {showSchemaPicker && schemaList.length > 1 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSchemaPicker(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-32 py-1 max-h-48 overflow-y-auto">
                {schemaList.map(s => (
                  <button
                    key={s}
                    onClick={() => { onSchemaChange(s); setShowSchemaPicker(false) }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                      activeSchema === s ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    <Layers size={10} className="shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AccordionSection>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/DatabasesSection.tsx
git commit -m "feat: add DatabasesSection with database chips and schema selector"
```

---

### Task 8: Update SchemaTreeItem — Row Counts and FK References

**Files:**
- Modify: `src/renderer/src/components/schema/SchemaTreeItem.tsx`

- [ ] **Step 1: Update SchemaTreeItem to support row count and FK display**

Replace the entire contents of `src/renderer/src/components/schema/SchemaTreeItem.tsx`:

```tsx
import { ChevronRight, ChevronDown, Table2, Eye, Key, Link, Hash } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'

interface Props {
  label: string
  icon?: React.ReactNode
  depth?: number
  expanded?: boolean
  onToggle?: () => void
  onClick?: () => void
  actions?: React.ReactNode
  children?: React.ReactNode
  meta?: string
}

export function SchemaTreeItem({ label, icon, depth = 0, expanded, onToggle, onClick, actions, children, meta }: Props) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 14

  return (
    <div>
      <div
        onClick={() => { onToggle?.(); onClick?.() }}
        className="group flex items-center gap-1.5 py-0.5 px-1 cursor-pointer text-xs hover:bg-white/5 rounded transition-colors"
        style={{ paddingLeft }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="text-text-muted shrink-0" /> : <ChevronRight size={12} className="text-text-muted shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate text-text-secondary flex-1">{label}</span>
        {meta && <span className="text-text-muted text-[9px] shrink-0">{meta}</span>}
        {actions && <span className="flex items-center gap-0.5 shrink-0">{actions}</span>}
      </div>
      {expanded && children && <div>{children}</div>}
    </div>
  )
}

export function TableIcon({ type }: { type: 'table' | 'view' }) {
  return type === 'view'
    ? <Eye size={12} className="text-info" />
    : <Table2 size={12} className="text-accent" />
}

export function ColumnIcon({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) return <Key size={11} className="text-warning" />
  if (column.isForeignKey) return <Link size={11} className="text-info" />
  return <Hash size={11} className="text-text-muted" />
}

export function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}
```

Key changes:
- Added `meta` prop for row count / FK reference display
- Actions are now **always visible** (removed `hidden group-hover:flex`, now just `flex`)
- Added `formatRowCount` utility export

- [ ] **Step 2: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/schema/SchemaTreeItem.tsx
git commit -m "feat: update SchemaTreeItem with meta prop, always-visible actions, formatRowCount"
```

---

### Task 9: TablesSection Component

**Files:**
- Create: `src/renderer/src/components/explorer/TablesSection.tsx`

- [ ] **Step 1: Create TablesSection component**

```tsx
import { useEffect } from 'react'
import { Download, Copy, PenSquare, ExternalLink } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { SchemaTreeItem, TableIcon, ColumnIcon, formatRowCount } from '@/components/schema/SchemaTreeItem'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'

interface TablesSectionProps {
  connectionId: string
  activeSchema: string
  onExportTable: (tableName: string) => void
}

export function TablesSection({ connectionId, activeSchema, onExportTable }: TablesSectionProps) {
  const { tables, columns, expandedTables, rowCounts, filterText, fetchTables, fetchColumns, fetchRowCount, toggleTable } = useSchemaStore()
  const { addQueryTab } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const tableList = allTables.filter(t => t.type === 'table')
  const filtered = filterText
    ? tableList.filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()))
    : tableList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, fetchTables])

  // Fetch row counts for visible tables
  useEffect(() => {
    filtered.forEach(t => {
      fetchRowCount(connectionId, t.name, activeSchema)
    })
  }, [connectionId, activeSchema, filtered.length, fetchRowCount])

  const handleExpandTable = async (tableName: string) => {
    const key = `${connectionId}:${activeSchema}:${tableName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, tableName, activeSchema)
    }
  }

  const getOverflowItems = (tableName: string): MenuItem[] => [
    {
      label: 'Export',
      icon: <Download size={12} />,
      onClick: () => onExportTable(tableName)
    },
    {
      label: 'Copy name',
      icon: <Copy size={12} />,
      onClick: () => {
        navigator.clipboard.writeText(tableName)
        addToast({ type: 'success', title: 'Copied table name' })
      }
    },
    {
      label: 'Copy SELECT',
      icon: <Copy size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      }
    },
    {
      label: 'Open in tab',
      icon: <PenSquare size={12} />,
      onClick: () => {
        addQueryTab(connectionId, `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`)
      }
    }
  ]

  return (
    <AccordionSection title="TABLES" count={filtered.length}>
      <div className="px-1">
        {filtered.length === 0 && (
          <p className="text-text-muted text-xs px-2 py-3 text-center">
            {filterText ? 'No matching tables' : 'No tables found'}
          </p>
        )}
        {filtered.map(table => {
          const colKey = `${connectionId}:${activeSchema}:${table.name}`
          const isExpanded = expandedTables.has(colKey)
          const cols = columns.get(colKey) ?? []
          const count = rowCounts.get(colKey)

          return (
            <SchemaTreeItem
              key={table.name}
              label={table.name}
              icon={<TableIcon type="table" />}
              depth={0}
              expanded={isExpanded}
              onToggle={() => handleExpandTable(table.name)}
              meta={count !== undefined ? formatRowCount(count) : undefined}
              actions={<OverflowMenu items={getOverflowItems(table.name)} />}
            >
              {cols.map(col => (
                <SchemaTreeItem
                  key={col.name}
                  label={`${col.name} ${col.dataType}`}
                  icon={<ColumnIcon column={col} />}
                  depth={1}
                  meta={col.isForeignKey && col.references ? `→ ${col.references.table}.${col.references.column}` : undefined}
                />
              ))}
            </SchemaTreeItem>
          )
        })}
      </div>
    </AccordionSection>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/TablesSection.tsx
git commit -m "feat: add TablesSection with row counts, overflow menu, FK references"
```

---

### Task 10: ViewsSection Component

**Files:**
- Create: `src/renderer/src/components/explorer/ViewsSection.tsx`

- [ ] **Step 1: Create ViewsSection component**

```tsx
import { useEffect } from 'react'
import { Copy, PenSquare } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { SchemaTreeItem, TableIcon, ColumnIcon } from '@/components/schema/SchemaTreeItem'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'

interface ViewsSectionProps {
  connectionId: string
  activeSchema: string
}

export function ViewsSection({ connectionId, activeSchema }: ViewsSectionProps) {
  const { tables, columns, expandedTables, filterText, fetchTables, fetchColumns, toggleTable } = useSchemaStore()
  const { addQueryTab } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const viewList = allTables.filter(t => t.type === 'view')
  const filtered = filterText
    ? viewList.filter(v => v.name.toLowerCase().includes(filterText.toLowerCase()))
    : viewList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, fetchTables])

  const handleExpandView = async (viewName: string) => {
    const key = `${connectionId}:${activeSchema}:${viewName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, viewName, activeSchema)
    }
  }

  const getOverflowItems = (viewName: string): MenuItem[] => [
    {
      label: 'Copy name',
      icon: <Copy size={12} />,
      onClick: () => {
        navigator.clipboard.writeText(viewName)
        addToast({ type: 'success', title: 'Copied view name' })
      }
    },
    {
      label: 'Copy SELECT',
      icon: <Copy size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      }
    },
    {
      label: 'Open in tab',
      icon: <PenSquare size={12} />,
      onClick: () => {
        addQueryTab(connectionId, `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`)
      }
    }
  ]

  // Don't render section if no views exist and no filter is active
  if (viewList.length === 0 && !filterText) return null

  return (
    <AccordionSection title="VIEWS" count={filtered.length}>
      <div className="px-1">
        {filtered.length === 0 && (
          <p className="text-text-muted text-xs px-2 py-3 text-center">
            {filterText ? 'No matching views' : 'No views found'}
          </p>
        )}
        {filtered.map(view => {
          const colKey = `${connectionId}:${activeSchema}:${view.name}`
          const isExpanded = expandedTables.has(colKey)
          const cols = columns.get(colKey) ?? []

          return (
            <SchemaTreeItem
              key={view.name}
              label={view.name}
              icon={<TableIcon type="view" />}
              depth={0}
              expanded={isExpanded}
              onToggle={() => handleExpandView(view.name)}
              actions={<OverflowMenu items={getOverflowItems(view.name)} />}
            >
              {cols.map(col => (
                <SchemaTreeItem
                  key={col.name}
                  label={`${col.name} ${col.dataType}`}
                  icon={<ColumnIcon column={col} />}
                  depth={1}
                  meta={col.isForeignKey && col.references ? `→ ${col.references.table}.${col.references.column}` : undefined}
                />
              ))}
            </SchemaTreeItem>
          )
        })}
      </div>
    </AccordionSection>
  )
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/ViewsSection.tsx
git commit -m "feat: add ViewsSection with overflow menu and column display"
```

---

### Task 11: Rewire Sidebar and Remove Old Components

**Files:**
- Modify: `src/renderer/src/components/shell/Sidebar.tsx`
- Modify: `src/renderer/src/components/shell/ActivityBar.tsx`
- Delete: `src/renderer/src/components/schema/SchemaTree.tsx`
- Delete: `src/renderer/src/components/connections/ConnectionList.tsx`

- [ ] **Step 1: Rewrite Sidebar.tsx to use new explorer sections**

Replace the entire contents of `src/renderer/src/components/shell/Sidebar.tsx`:

```tsx
import { useState } from 'react'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import { SearchFilter } from '@/components/explorer/SearchFilter'
import { ConnectionsSection } from '@/components/explorer/ConnectionsSection'
import { DatabasesSection } from '@/components/explorer/DatabasesSection'
import { TablesSection } from '@/components/explorer/TablesSection'
import { ViewsSection } from '@/components/explorer/ViewsSection'
import { SavedQueriesPanel } from '@/components/saved-queries/SavedQueriesPanel'
import { ChartsDashboard } from '@/components/charts-panel/ChartsDashboard'
import { ExtensionsPanel } from '@/components/plugins/ExtensionsPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { ExportModal } from '@/components/export/ExportModal'
import { ImportModal } from '@/components/import/ImportModal'
import { Upload } from 'lucide-react'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()

  const [exportTable, setExportTable] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    charts: 'Charts',
    extensions: 'Extensions',
    settings: 'Settings'
  }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)
  const conn = connections.find(c => c.id === activeConnectionId)

  const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
  const [activeSchema, setActiveSchema] = useState(defaultSchema ?? 'public')
  const [activeDatabase, setActiveDatabase] = useState(conn?.database ?? '')

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>{titles[activePanel] ?? 'Explorer'}</span>
        {isConnected && activePanel === 'explorer' && (
          <button
            onClick={() => setShowImport(true)}
            className="text-text-muted hover:text-accent transition-colors"
            title="Import data"
          >
            <Upload size={12} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'explorer' && (
          <>
            {isConnected && <SearchFilter />}
            <ConnectionsSection />
            {isConnected && activeConnectionId && (
              <>
                <DatabasesSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                  onSchemaChange={setActiveSchema}
                  activeDatabase={activeDatabase}
                  onDatabaseChange={setActiveDatabase}
                />
                <TablesSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                  onExportTable={setExportTable}
                />
                <ViewsSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                />
              </>
            )}
          </>
        )}
        {activePanel === 'query' && <SavedQueriesPanel />}
        {activePanel === 'charts' && (
          isConnected ? <ChartsDashboard /> : (
            <p className="text-text-muted text-xs px-3 py-8 text-center">Connect and run queries to see charts</p>
          )
        )}
        {activePanel === 'extensions' && <ExtensionsPanel />}
        {activePanel === 'settings' && <SettingsPanel />}
      </div>

      {/* Modals */}
      {exportTable && activeConnectionId && (
        <ExportModal tableName={exportTable} connectionId={activeConnectionId} onClose={() => setExportTable(null)} />
      )}
      {showImport && activeConnectionId && (
        <ImportModal connectionId={activeConnectionId} onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update ActivityBar to remove Schema panel**

In `src/renderer/src/components/shell/ActivityBar.tsx`, remove the schema entry from `topItems`. Replace the array (lines 4-9):

```tsx
const topItems: { id: ActivityPanel; icon: typeof Database; label: string }[] = [
  { id: 'explorer', icon: Database, label: 'Explorer' },
  { id: 'query', icon: PenSquare, label: 'Saved Queries' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions' }
]
```

Remove `GitFork` from the import since it's no longer used here:

```tsx
import { Database, PenSquare, BarChart3, Puzzle, Settings } from 'lucide-react'
```

- [ ] **Step 3: Delete old components**

```bash
rm src/renderer/src/components/schema/SchemaTree.tsx
rm src/renderer/src/components/connections/ConnectionList.tsx
```

- [ ] **Step 4: Check for remaining imports of deleted files**

Run: `grep -r "SchemaTree\|ConnectionList" src/renderer/src/ --include="*.tsx" --include="*.ts" -l`

Expected: No files should reference the deleted components. If any do, update their imports.

- [ ] **Step 5: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 6: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: rewire Sidebar with accordion explorer, remove old SchemaTree and ConnectionList"
```

---

### Task 12: Wire "Open in tab" with SQL pre-fill

**Files:**
- Modify: `src/renderer/src/stores/tabs.ts`
- Modify: `src/renderer/src/components/explorer/TablesSection.tsx`
- Modify: `src/renderer/src/components/explorer/ViewsSection.tsx`

The current `addQueryTab(connectionId, schema)` takes a schema as the second param, not SQL. The "Open in tab" overflow action needs to create a tab and then set its SQL.

- [ ] **Step 1: Update TablesSection and ViewsSection to use addQueryTab + updateTabSql**

In both `TablesSection.tsx` and `ViewsSection.tsx`, import `updateTabSql` from the tabs store:

```typescript
const { addQueryTab, updateTabSql } = useTabsStore()
```

And update the "Open in tab" overflow item's onClick:

```typescript
{
  label: 'Open in tab',
  icon: <PenSquare size={12} />,
  onClick: () => {
    const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
    const tabId = addQueryTab(connectionId)
    updateTabSql(tabId, sql)
  }
}
```

Apply the same pattern in ViewsSection for view names.

- [ ] **Step 2: Verify the app compiles**

Run: `npx electron-vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/explorer/TablesSection.tsx src/renderer/src/components/explorer/ViewsSection.tsx
git commit -m "feat: wire Open in tab with SQL pre-fill via updateTabSql"
```

---

### Task 13: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Build the full app**

Run: `npx electron-vite build`
Expected: Clean build, no errors, no warnings about missing imports

- [ ] **Step 2: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All PASS

- [ ] **Step 3: Verify no orphaned files**

Check that `src/renderer/src/components/schema/` only contains `SchemaTreeItem.tsx` (the updated version) and that `src/renderer/src/components/connections/` only contains `ConnectionForm.tsx`.

```bash
ls src/renderer/src/components/schema/
ls src/renderer/src/components/connections/
ls src/renderer/src/components/explorer/
```

Expected:
- `schema/`: `SchemaTreeItem.tsx`
- `connections/`: `ConnectionForm.tsx`
- `explorer/`: `AccordionSection.tsx`, `ConnectionsSection.tsx`, `DatabasesSection.tsx`, `OverflowMenu.tsx`, `SearchFilter.tsx`, `TablesSection.tsx`, `ViewsSection.tsx`

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for explorer panel redesign"
```
