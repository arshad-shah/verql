# Explorer UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the accordion-based explorer with a unified deep tree (Connection → Database → Schema → Tables/Views → Columns) with a connection switcher dropdown and contained-card table expansion.

**Architecture:** Connection switcher at top using Select primitive, unified tree below using TreeItem primitives for all hierarchy levels. Expanded tables render as bordered cards with column details, constraint badges, and stat pills. State managed via `expandedTreeNodes: Set<string>` in ui.ts store replacing the old `expandedSections`.

**Tech Stack:** React 19, Zustand, CVA, Tailwind CSS, lucide-react icons, existing primitives (TreeItem, Select, SearchInput, ContextMenu, DropdownMenu, Badge, Text, EmptyState)

**Spec:** `docs/superpowers/specs/2026-04-09-explorer-ux-redesign.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/renderer/src/stores/ui.ts` | Modify | Replace `expandedSections` with `expandedTreeNodes: Set<string>` and tree node actions |
| `src/renderer/src/components/explorer/ConnectionSwitcher.tsx` | Create | Dropdown for selecting active connection + gear button for management |
| `src/renderer/src/components/explorer/ColumnRow.tsx` | Create | Single column row with icon badge, name, type, constraint pill |
| `src/renderer/src/components/explorer/TableNode.tsx` | Create | Expandable table as contained card with columns, row count, index count |
| `src/renderer/src/components/explorer/ViewNode.tsx` | Create | Expandable view node (simpler than table, no row counts) |
| `src/renderer/src/components/explorer/SchemaNode.tsx` | Create | Schema tree node containing Tables/Views groups |
| `src/renderer/src/components/explorer/DatabaseNode.tsx` | Create | Database tree node containing schemas |
| `src/renderer/src/components/explorer/ExplorerTree.tsx` | Create | Main tree component composing all node types |
| `src/renderer/src/components/explorer/icons.tsx` | Modify | Add Database, Schema icons |
| `src/renderer/src/components/explorer/SearchFilter.tsx` | Keep | Minor — no changes needed |
| `src/renderer/src/components/shell/Sidebar.tsx` | Modify | Replace old sections with ExplorerTree |
| `src/renderer/src/components/explorer/ConnectionsSection.tsx` | Delete | Replaced by ConnectionSwitcher |
| `src/renderer/src/components/explorer/DatabasesSection.tsx` | Delete | Replaced by DatabaseNode |
| `src/renderer/src/components/explorer/TablesSection.tsx` | Delete | Replaced by TableNode in tree |
| `src/renderer/src/components/explorer/ViewsSection.tsx` | Delete | Replaced by ViewNode in tree |

---

### Task 1: Update UI Store — Replace expandedSections with expandedTreeNodes

**Files:**
- Modify: `src/renderer/src/stores/ui.ts`
- Test: `tests/unit/stores/ui.test.ts`

- [ ] **Step 1: Write failing tests for new tree node state**

Create `tests/unit/stores/ui.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '@/stores/ui'

describe('ui store — tree node expansion', () => {
  beforeEach(() => {
    useUiStore.setState({
      expandedTreeNodes: new Set<string>(),
      activePanel: 'explorer',
      sidebarVisible: true,
    })
  })

  it('toggleTreeNode adds a node when not present', () => {
    useUiStore.getState().toggleTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(true)
  })

  it('toggleTreeNode removes a node when present', () => {
    useUiStore.setState({ expandedTreeNodes: new Set(['db:myapp_prod']) })
    useUiStore.getState().toggleTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(false)
  })

  it('expandTreeNode adds without toggling', () => {
    useUiStore.getState().expandTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(true)
    // calling again should NOT remove it
    useUiStore.getState().expandTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(true)
  })

  it('collapseAllTreeNodes clears everything', () => {
    useUiStore.setState({
      expandedTreeNodes: new Set(['db:myapp_prod', 'schema:myapp_prod.public', 'table:myapp_prod.public.users']),
    })
    useUiStore.getState().collapseAllTreeNodes()
    expect(useUiStore.getState().expandedTreeNodes.size).toBe(0)
  })

  // Backward compat: expandedSections removed, toggleSection removed
  it('does not have expandedSections or toggleSection', () => {
    const state = useUiStore.getState() as Record<string, unknown>
    expect(state.expandedSections).toBeUndefined()
    expect(state.toggleSection).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: FAIL — `toggleTreeNode`, `expandTreeNode`, `collapseAllTreeNodes` don't exist yet; `expandedSections` still exists.

- [ ] **Step 3: Update the ui store**

Modify `src/renderer/src/stores/ui.ts`. Replace `expandedSections` and `toggleSection` with the new tree node state:

```typescript
import { create } from 'zustand'
import { useSettingsStore } from './settings'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedTreeNodes: Set<string>
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  toggleTreeNode: (path: string) => void
  expandTreeNode: (path: string) => void
  collapseAllTreeNodes: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  expandedTreeNodes: new Set<string>(),

  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true,
    })),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  setSidebarWidth: (width) => {
    const clamped = Math.min(480, Math.max(180, width))
    useSettingsStore.getState().updateSettings({ appearance: { sidebarWidth: clamped } })
  },

  setSplitRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, ratio))
    useSettingsStore.getState().updateSettings({ appearance: { splitRatio: clamped } })
  },

  toggleTreeNode: (path) =>
    set((state) => {
      const next = new Set(state.expandedTreeNodes)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedTreeNodes: next }
    }),

  expandTreeNode: (path) =>
    set((state) => {
      if (state.expandedTreeNodes.has(path)) return state
      const next = new Set(state.expandedTreeNodes)
      next.add(path)
      return { expandedTreeNodes: next }
    }),

  collapseAllTreeNodes: () => set({ expandedTreeNodes: new Set() }),
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ui.ts tests/unit/stores/ui.test.ts
git commit -m "refactor(ui store): replace expandedSections with expandedTreeNodes for unified tree"
```

---

### Task 2: Add Database and Schema Icons

**Files:**
- Modify: `src/renderer/src/components/explorer/icons.tsx`

- [ ] **Step 1: Add DatabaseIcon and SchemaIcon to icons.tsx**

Add two new icon components to the existing file. The current file exports `TableIcon` and `ColumnIcon`. Add after the existing exports:

```typescript
import { Table2, Eye, Key, Link, Hash, Database, FolderOpen } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'

// existing TableIcon and ColumnIcon stay unchanged

export function DatabaseIcon() {
  return <Database size={14} className="text-[var(--color-info)] shrink-0" />
}

export function SchemaIcon() {
  return <FolderOpen size={14} className="text-[var(--color-warning)] shrink-0" />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/icons.tsx
git commit -m "feat(explorer): add DatabaseIcon and SchemaIcon"
```

---

### Task 3: Create ConnectionSwitcher Component

**Files:**
- Create: `src/renderer/src/components/explorer/ConnectionSwitcher.tsx`

- [ ] **Step 1: Create the ConnectionSwitcher component**

```tsx
import { Settings } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { Select } from '@/primitives/forms/Select'
import { IconButton } from '@/primitives/forms/IconButton'
import { Tooltip } from '@/primitives/feedback/Tooltip'
import { Flex } from '@/primitives/layout/Flex'

export function ConnectionSwitcher() {
  const connections = useConnectionsStore((s) => s.connections)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const connectedIds = useConnectionsStore((s) => s.connectedIds)
  const connect = useConnectionsStore((s) => s.connect)
  const setActiveConnection = useConnectionsStore((s) => s.setActiveConnection)
  const openConnectionForm = useTabsStore((s) => s.openConnectionForm)

  const options = connections.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const handleChange = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      await connect(id)
    }
  }

  return (
    <Flex gap="xs" align="center" className="px-2 py-1.5">
      <div className="flex-1 min-w-0">
        <Select
          size="sm"
          value={activeConnectionId ?? ''}
          onChange={handleChange}
          options={options}
          placeholder="Select connection…"
          renderValue={(option) =>
            option ? (
              <Flex gap="xs" align="center">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: connectedIds.has(option.value)
                      ? 'var(--color-success)'
                      : 'var(--color-text-disabled)',
                  }}
                />
                <span className="truncate">{option.label}</span>
              </Flex>
            ) : null
          }
          renderOption={(option, { selected }) => (
            <Flex gap="xs" align="center">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: connectedIds.has(option.value)
                    ? 'var(--color-success)'
                    : 'var(--color-text-disabled)',
                }}
              />
              <span className="truncate">{option.label}</span>
            </Flex>
          )}
        />
      </div>
      <Tooltip content="Manage connections">
        <IconButton size="sm" variant="ghost" onClick={() => openConnectionForm()}>
          <Settings size={14} />
        </IconButton>
      </Tooltip>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/ConnectionSwitcher.tsx
git commit -m "feat(explorer): create ConnectionSwitcher dropdown component"
```

---

### Task 4: Create ColumnRow Component

**Files:**
- Create: `src/renderer/src/components/explorer/ColumnRow.tsx`

- [ ] **Step 1: Create the ColumnRow component**

This renders a single column inside an expanded table card — icon badge, name, type, and constraint pill.

```tsx
import { Key, Link, Hash } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { useToastStore } from '@/stores/toast'
import { Flex } from '@/primitives/layout/Flex'
import { Text } from '@/primitives/typography/Text'

interface ColumnRowProps {
  column: SchemaColumn
  tableName: string
}

function ColumnIcon({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) {
    return (
      <span className="w-[18px] h-[18px] rounded flex items-center justify-center bg-[var(--color-warning)]/10 shrink-0">
        <Key size={10} className="text-[var(--color-warning)]" />
      </span>
    )
  }
  if (column.isForeignKey) {
    return (
      <span className="w-[18px] h-[18px] rounded flex items-center justify-center bg-[var(--color-info)]/10 shrink-0">
        <Link size={10} className="text-[var(--color-info)]" />
      </span>
    )
  }
  return (
    <span className="w-[18px] h-[18px] rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]/50 shrink-0">
      <Hash size={10} className="text-[var(--color-text-disabled)]" />
    </span>
  )
}

function ConstraintBadge({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) {
    return (
      <span className="px-1.5 rounded text-[9px] font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
        PK
      </span>
    )
  }
  if (column.isForeignKey) {
    return (
      <span className="px-1.5 rounded text-[9px] font-medium bg-[var(--color-info)]/10 text-[var(--color-info)]">
        FK
      </span>
    )
  }
  if (column.isUnique) {
    return (
      <span className="px-1.5 rounded text-[9px] font-medium bg-[var(--color-success)]/10 text-[var(--color-success)]">
        UQ
      </span>
    )
  }
  return null
}

export function ColumnRow({ column, tableName }: ColumnRowProps) {
  const addToast = useToastStore((s) => s.addToast)

  const menuItems = [
    {
      label: 'Copy column name',
      onSelect: () => {
        navigator.clipboard.writeText(column.name)
        addToast({ type: 'info', message: `Copied "${column.name}"` })
      },
    },
    {
      label: 'Copy qualified name',
      onSelect: () => {
        const qualified = `${tableName}.${column.name}`
        navigator.clipboard.writeText(qualified)
        addToast({ type: 'info', message: `Copied "${qualified}"` })
      },
    },
  ]

  return (
    <ContextMenu items={menuItems}>
      <div className="flex items-center gap-2 px-3 py-1 hover:bg-[var(--color-hover)] transition-colors">
        <ColumnIcon column={column} />
        <Text size="xs" className="flex-1 truncate" color={column.isPrimaryKey ? 'warning' : column.isForeignKey ? 'accent' : 'primary'}>
          {column.name}
        </Text>
        <Text size="xs" color="muted" className="shrink-0">
          {column.dataType}
        </Text>
        <ConstraintBadge column={column} />
      </div>
    </ContextMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/ColumnRow.tsx
git commit -m "feat(explorer): create ColumnRow component with icon badges and constraint pills"
```

---

### Task 5: Create TableNode Component

**Files:**
- Create: `src/renderer/src/components/explorer/TableNode.tsx`

- [ ] **Step 1: Create the TableNode component**

This renders a table as a contained card when expanded, with header showing name + stat pills, and column rows inside.

```tsx
import { Table2, ExternalLink, Play } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/IconButton'
import { Tooltip } from '@/primitives/feedback/Tooltip'
import { Text } from '@/primitives/typography/Text'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ColumnRow } from './ColumnRow'

interface TableNodeProps {
  tableName: string
  connectionId: string
  schema: string
  depth: number
  onExportTable?: (tableName: string) => void
}

function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return count.toString()
}

export function TableNode({ tableName, connectionId, schema, depth, onExportTable }: TableNodeProps) {
  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const columns = useSchemaStore((s) => s.columns)
  const indexes = useSchemaStore((s) => s.indexes)
  const rowCounts = useSchemaStore((s) => s.rowCounts)
  const fetchColumns = useSchemaStore((s) => s.fetchColumns)
  const fetchIndexes = useSchemaStore((s) => s.fetchIndexes)
  const fetchRowCount = useSchemaStore((s) => s.fetchRowCount)
  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const addToast = useToastStore((s) => s.addToast)

  const nodeKey = `table:${connectionId}:${schema}:${tableName}`
  const cacheKey = `${connectionId}:${schema}:${tableName}`
  const expanded = expandedTreeNodes.has(nodeKey)
  const tableColumns: SchemaColumn[] = columns.get(cacheKey) ?? []
  const tableIndexes = indexes.get(cacheKey) ?? []
  const rowCount = rowCounts.get(cacheKey)

  const handleToggle = async () => {
    toggleTreeNode(nodeKey)
    if (!expanded) {
      fetchColumns(connectionId, tableName, schema)
      fetchIndexes(connectionId, tableName, schema)
      fetchRowCount(connectionId, tableName, schema)
    }
  }

  const handleOpenTable = () => {
    const tab = addQueryTab(connectionId)
    updateTabSql(tab.id, `SELECT * FROM ${tableName} LIMIT 100;`)
  }

  const handleCopySelect = () => {
    navigator.clipboard.writeText(`SELECT * FROM ${tableName};`)
    addToast({ type: 'info', message: `Copied SELECT for "${tableName}"` })
  }

  const menuItems = [
    { label: 'Open in query tab', onSelect: handleOpenTable },
    { label: 'Copy table name', onSelect: () => { navigator.clipboard.writeText(tableName); addToast({ type: 'info', message: `Copied "${tableName}"` }) } },
    { label: 'Copy SELECT *', onSelect: handleCopySelect },
    ...(onExportTable ? [{ label: 'Export table', onSelect: () => onExportTable(tableName) }] : []),
  ]

  const paddingLeft = 8 + depth * 16

  return (
    <ContextMenu items={menuItems}>
      <div>
        {expanded ? (
          /* Contained card when expanded */
          <div className="mx-1 mb-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden">
            {/* Card header */}
            <button
              onClick={handleToggle}
              className="w-full flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)] hover:bg-[var(--color-hover)] transition-colors text-left"
              style={{ paddingLeft }}
            >
              <ChevronDown size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
              <Table2 size={14} className="text-[var(--color-accent)] shrink-0" />
              <Text size="xs" weight="medium" className="flex-1 truncate">{tableName}</Text>
              {rowCount != null && (
                <span className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full text-[10px]">
                  {formatRowCount(rowCount)}
                </span>
              )}
              {tableIndexes.length > 0 && (
                <span className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full text-[10px]">
                  {tableIndexes.length} idx
                </span>
              )}
              {/* Hover actions */}
              <span className="opacity-0 group-hover/table:opacity-100 flex gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Tooltip content="Open table">
                  <IconButton size="xs" variant="ghost" onClick={handleOpenTable}>
                    <ExternalLink size={12} />
                  </IconButton>
                </Tooltip>
              </span>
            </button>
            {/* Column rows */}
            <div className="py-1">
              {tableColumns.map((col) => (
                <ColumnRow key={col.name} column={col} tableName={tableName} />
              ))}
              {tableColumns.length === 0 && (
                <Text size="xs" color="muted" className="px-3 py-2">Loading columns…</Text>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed row */
          <button
            onClick={handleToggle}
            className="group/table w-full flex items-center gap-2 py-1 px-2 hover:bg-[var(--color-hover)] transition-colors rounded text-left"
            style={{ paddingLeft }}
          >
            <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
            <Table2 size={14} className="text-[var(--color-accent)] shrink-0" />
            <Text size="xs" className="flex-1 truncate">{tableName}</Text>
            {rowCount != null && (
              <Text size="xs" color="muted" className="shrink-0">{formatRowCount(rowCount)}</Text>
            )}
            <span className="opacity-0 group-hover/table:opacity-100 flex gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Tooltip content="Open table">
                <IconButton size="xs" variant="ghost" onClick={handleOpenTable}>
                  <ExternalLink size={12} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Query">
                <IconButton size="xs" variant="ghost" onClick={handleCopySelect}>
                  <Play size={12} />
                </IconButton>
              </Tooltip>
            </span>
          </button>
        )}
      </div>
    </ContextMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/TableNode.tsx
git commit -m "feat(explorer): create TableNode with contained card expansion style"
```

---

### Task 6: Create ViewNode Component

**Files:**
- Create: `src/renderer/src/components/explorer/ViewNode.tsx`

- [ ] **Step 1: Create the ViewNode component**

Similar to TableNode but simpler — no row counts, no export, uses Eye icon.

```tsx
import { Eye, ExternalLink, Play, ChevronDown, ChevronRight } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/IconButton'
import { Tooltip } from '@/primitives/feedback/Tooltip'
import { Text } from '@/primitives/typography/Text'
import { ColumnRow } from './ColumnRow'

interface ViewNodeProps {
  viewName: string
  connectionId: string
  schema: string
  depth: number
}

export function ViewNode({ viewName, connectionId, schema, depth }: ViewNodeProps) {
  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const columns = useSchemaStore((s) => s.columns)
  const fetchColumns = useSchemaStore((s) => s.fetchColumns)
  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const addToast = useToastStore((s) => s.addToast)

  const nodeKey = `view:${connectionId}:${schema}:${viewName}`
  const cacheKey = `${connectionId}:${schema}:${viewName}`
  const expanded = expandedTreeNodes.has(nodeKey)
  const viewColumns: SchemaColumn[] = columns.get(cacheKey) ?? []

  const handleToggle = async () => {
    toggleTreeNode(nodeKey)
    if (!expanded) {
      fetchColumns(connectionId, viewName, schema)
    }
  }

  const handleOpenView = () => {
    const tab = addQueryTab(connectionId)
    updateTabSql(tab.id, `SELECT * FROM ${viewName} LIMIT 100;`)
  }

  const menuItems = [
    { label: 'Open in query tab', onSelect: handleOpenView },
    { label: 'Copy view name', onSelect: () => { navigator.clipboard.writeText(viewName); addToast({ type: 'info', message: `Copied "${viewName}"` }) } },
    { label: 'Copy SELECT *', onSelect: () => { navigator.clipboard.writeText(`SELECT * FROM ${viewName};`); addToast({ type: 'info', message: `Copied SELECT for "${viewName}"` }) } },
  ]

  const paddingLeft = 8 + depth * 16

  return (
    <ContextMenu items={menuItems}>
      <div>
        {expanded ? (
          <div className="mx-1 mb-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <button
              onClick={handleToggle}
              className="w-full flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)] hover:bg-[var(--color-hover)] transition-colors text-left"
              style={{ paddingLeft }}
            >
              <ChevronDown size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
              <Eye size={14} className="text-[var(--color-info)] shrink-0" />
              <Text size="xs" weight="medium" className="flex-1 truncate">{viewName}</Text>
            </button>
            <div className="py-1">
              {viewColumns.map((col) => (
                <ColumnRow key={col.name} column={col} tableName={viewName} />
              ))}
              {viewColumns.length === 0 && (
                <Text size="xs" color="muted" className="px-3 py-2">Loading columns…</Text>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            className="group/view w-full flex items-center gap-2 py-1 px-2 hover:bg-[var(--color-hover)] transition-colors rounded text-left"
            style={{ paddingLeft }}
          >
            <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
            <Eye size={14} className="text-[var(--color-info)] shrink-0" />
            <Text size="xs" className="flex-1 truncate">{viewName}</Text>
            <span className="opacity-0 group-hover/view:opacity-100 flex gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Tooltip content="Open view">
                <IconButton size="xs" variant="ghost" onClick={handleOpenView}>
                  <ExternalLink size={12} />
                </IconButton>
              </Tooltip>
            </span>
          </button>
        )}
      </div>
    </ContextMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/ViewNode.tsx
git commit -m "feat(explorer): create ViewNode with contained card expansion"
```

---

### Task 7: Create SchemaNode Component

**Files:**
- Create: `src/renderer/src/components/explorer/SchemaNode.tsx`

- [ ] **Step 1: Create the SchemaNode component**

Schema node expands to show Tables/Views groups with static labels. Fetches tables on expansion.

```tsx
import { useEffect } from 'react'
import { FolderOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/IconButton'
import { Tooltip } from '@/primitives/feedback/Tooltip'
import { Text } from '@/primitives/typography/Text'
import { TableNode } from './TableNode'
import { ViewNode } from './ViewNode'

interface SchemaNodeProps {
  schemaName: string
  connectionId: string
  depth: number
  onExportTable?: (tableName: string) => void
}

export function SchemaNode({ schemaName, connectionId, depth, onExportTable }: SchemaNodeProps) {
  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const tables = useSchemaStore((s) => s.tables)
  const filterText = useSchemaStore((s) => s.filterText)
  const fetchTables = useSchemaStore((s) => s.fetchTables)
  const clearCache = useSchemaStore((s) => s.clearCache)
  const addToast = useToastStore((s) => s.addToast)

  const nodeKey = `schema:${connectionId}:${schemaName}`
  const cacheKey = `${connectionId}:${schemaName}`
  const expanded = expandedTreeNodes.has(nodeKey)
  const allTables = tables.get(cacheKey) ?? []

  const filter = filterText.toLowerCase()
  const filteredTables = allTables.filter((t) => t.type === 'table' && t.name.toLowerCase().includes(filter))
  const filteredViews = allTables.filter((t) => t.type === 'view' && t.name.toLowerCase().includes(filter))

  useEffect(() => {
    if (expanded && allTables.length === 0) {
      fetchTables(connectionId, schemaName)
    }
  }, [expanded, connectionId, schemaName])

  const handleToggle = () => {
    toggleTreeNode(nodeKey)
    if (!expanded) {
      fetchTables(connectionId, schemaName)
    }
  }

  const handleRefresh = () => {
    clearCache(connectionId)
    fetchTables(connectionId, schemaName)
    addToast({ type: 'info', message: `Refreshed "${schemaName}"` })
  }

  const menuItems = [
    { label: 'Refresh', onSelect: handleRefresh },
    { label: 'Copy schema name', onSelect: () => { navigator.clipboard.writeText(schemaName); addToast({ type: 'info', message: `Copied "${schemaName}"` }) } },
  ]

  const paddingLeft = 8 + depth * 16
  const childDepth = depth + 1

  return (
    <ContextMenu items={menuItems}>
      <div>
        <button
          onClick={handleToggle}
          className="group/schema w-full flex items-center gap-2 py-1 px-2 hover:bg-[var(--color-hover)] transition-colors rounded text-left"
          style={{ paddingLeft }}
        >
          {expanded ? (
            <ChevronDown size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          )}
          <FolderOpen size={14} className="text-[var(--color-warning)] shrink-0" />
          <Text size="xs" weight="medium" className="flex-1 truncate">{schemaName}</Text>
          <span className="opacity-0 group-hover/schema:opacity-100 flex gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Tooltip content="Refresh">
              <IconButton size="xs" variant="ghost" onClick={handleRefresh}>
                <RefreshCw size={12} />
              </IconButton>
            </Tooltip>
          </span>
        </button>

        {expanded && (
          <div>
            {/* Tables group */}
            {filteredTables.length > 0 && (
              <div>
                <Text
                  size="xs"
                  color="muted"
                  weight="medium"
                  className="uppercase tracking-wider opacity-40 px-2 py-1"
                  style={{ paddingLeft: paddingLeft + 28 }}
                >
                  Tables
                </Text>
                {filteredTables.map((t) => (
                  <TableNode
                    key={t.name}
                    tableName={t.name}
                    connectionId={connectionId}
                    schema={schemaName}
                    depth={childDepth}
                    onExportTable={onExportTable}
                  />
                ))}
              </div>
            )}

            {/* Views group */}
            {filteredViews.length > 0 && (
              <div>
                <Text
                  size="xs"
                  color="muted"
                  weight="medium"
                  className="uppercase tracking-wider opacity-40 px-2 py-1"
                  style={{ paddingLeft: paddingLeft + 28 }}
                >
                  Views
                </Text>
                {filteredViews.map((v) => (
                  <ViewNode
                    key={v.name}
                    viewName={v.name}
                    connectionId={connectionId}
                    schema={schemaName}
                    depth={childDepth}
                  />
                ))}
              </div>
            )}

            {filteredTables.length === 0 && filteredViews.length === 0 && allTables.length > 0 && (
              <Text size="xs" color="muted" className="px-3 py-2" style={{ paddingLeft: paddingLeft + 28 }}>
                No matches
              </Text>
            )}

            {allTables.length === 0 && (
              <Text size="xs" color="muted" className="px-3 py-2" style={{ paddingLeft: paddingLeft + 28 }}>
                Loading…
              </Text>
            )}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/SchemaNode.tsx
git commit -m "feat(explorer): create SchemaNode with Tables/Views group labels"
```

---

### Task 8: Create DatabaseNode Component

**Files:**
- Create: `src/renderer/src/components/explorer/DatabaseNode.tsx`

- [ ] **Step 1: Create the DatabaseNode component**

Database node fetches schemas on expansion and renders SchemaNode children.

```tsx
import { useEffect } from 'react'
import { Database, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/IconButton'
import { Tooltip } from '@/primitives/feedback/Tooltip'
import { Text } from '@/primitives/typography/Text'
import { SchemaNode } from './SchemaNode'

interface DatabaseNodeProps {
  databaseName: string
  connectionId: string
  depth: number
  onExportTable?: (tableName: string) => void
}

export function DatabaseNode({ databaseName, connectionId, depth, onExportTable }: DatabaseNodeProps) {
  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const schemas = useSchemaStore((s) => s.schemas)
  const fetchSchemas = useSchemaStore((s) => s.fetchSchemas)
  const clearCache = useSchemaStore((s) => s.clearCache)
  const addToast = useToastStore((s) => s.addToast)

  const nodeKey = `db:${connectionId}:${databaseName}`
  const expanded = expandedTreeNodes.has(nodeKey)
  const schemaList = schemas.get(connectionId) ?? []

  useEffect(() => {
    if (expanded && schemaList.length === 0) {
      fetchSchemas(connectionId)
    }
  }, [expanded, connectionId])

  const handleToggle = () => {
    toggleTreeNode(nodeKey)
    if (!expanded) {
      fetchSchemas(connectionId)
    }
  }

  const handleRefresh = () => {
    clearCache(connectionId)
    fetchSchemas(connectionId)
    addToast({ type: 'info', message: `Refreshed "${databaseName}"` })
  }

  const menuItems = [
    { label: 'Refresh', onSelect: handleRefresh },
    { label: 'Copy database name', onSelect: () => { navigator.clipboard.writeText(databaseName); addToast({ type: 'info', message: `Copied "${databaseName}"` }) } },
  ]

  const paddingLeft = 8 + depth * 16

  return (
    <ContextMenu items={menuItems}>
      <div>
        <button
          onClick={handleToggle}
          className="group/db w-full flex items-center gap-2 py-1 px-2 hover:bg-[var(--color-hover)] transition-colors rounded text-left"
          style={{ paddingLeft }}
        >
          {expanded ? (
            <ChevronDown size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
          )}
          <Database size={14} className="text-[var(--color-info)] shrink-0" />
          <Text size="xs" weight="semibold" className="flex-1 truncate">{databaseName}</Text>
          <span className="opacity-0 group-hover/db:opacity-100 flex gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Tooltip content="Refresh">
              <IconButton size="xs" variant="ghost" onClick={handleRefresh}>
                <RefreshCw size={12} />
              </IconButton>
            </Tooltip>
          </span>
        </button>

        {expanded && (
          <div>
            {schemaList.map((s) => (
              <SchemaNode
                key={s}
                schemaName={s}
                connectionId={connectionId}
                depth={depth + 1}
                onExportTable={onExportTable}
              />
            ))}
            {schemaList.length === 0 && (
              <Text size="xs" color="muted" className="px-3 py-2" style={{ paddingLeft: paddingLeft + 28 }}>
                Loading…
              </Text>
            )}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/DatabaseNode.tsx
git commit -m "feat(explorer): create DatabaseNode with schema children"
```

---

### Task 9: Create ExplorerTree Component

**Files:**
- Create: `src/renderer/src/components/explorer/ExplorerTree.tsx`

- [ ] **Step 1: Create the ExplorerTree component**

Main component composing ConnectionSwitcher + SearchFilter + tree nodes. Handles edge cases for single-DB/single-schema engines.

```tsx
import { useEffect, useState } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { EmptyState } from '@/primitives/data-display/EmptyState'
import { Text } from '@/primitives/typography/Text'
import { Database } from 'lucide-react'
import { ConnectionSwitcher } from './ConnectionSwitcher'
import { SearchFilter } from './SearchFilter'
import { DatabaseNode } from './DatabaseNode'
import { SchemaNode } from './SchemaNode'
import { TableNode } from './TableNode'
import { ViewNode } from './ViewNode'

interface ExplorerTreeProps {
  onExportTable?: (tableName: string) => void
}

export function ExplorerTree({ onExportTable }: ExplorerTreeProps) {
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const connectedIds = useConnectionsStore((s) => s.connectedIds)
  const connections = useConnectionsStore((s) => s.connections)
  const databases = useSchemaStore((s) => s.databases)
  const schemas = useSchemaStore((s) => s.schemas)
  const tables = useSchemaStore((s) => s.tables)
  const filterText = useSchemaStore((s) => s.filterText)
  const fetchDatabases = useSchemaStore((s) => s.fetchDatabases)
  const fetchSchemas = useSchemaStore((s) => s.fetchSchemas)
  const fetchTables = useSchemaStore((s) => s.fetchTables)

  const isConnected = activeConnectionId != null && connectedIds.has(activeConnectionId)
  const activeConnection = connections.find((c) => c.id === activeConnectionId)
  const databaseList = activeConnectionId ? (databases.get(activeConnectionId) ?? []) : []
  const schemaList = activeConnectionId ? (schemas.get(activeConnectionId) ?? []) : []

  // Determine engine type for hierarchy flattening
  const isSingleDb = databaseList.length <= 1
  const isSingleSchema = schemaList.length <= 1
  const defaultSchema = schemaList[0] ?? 'public'

  useEffect(() => {
    if (isConnected && activeConnectionId) {
      fetchDatabases(activeConnectionId)
      fetchSchemas(activeConnectionId)
    }
  }, [isConnected, activeConnectionId])

  // For single-schema engines: fetch tables immediately
  useEffect(() => {
    if (isConnected && activeConnectionId && isSingleSchema && defaultSchema) {
      fetchTables(activeConnectionId, defaultSchema)
    }
  }, [isConnected, activeConnectionId, isSingleSchema, defaultSchema])

  if (!isConnected) {
    return (
      <div>
        <ConnectionSwitcher />
        <EmptyState
          title="No connection"
          description="Select a connection to browse databases"
          icon={<Database size={32} className="text-[var(--color-text-disabled)]" />}
        />
      </div>
    )
  }

  // Single-DB + single-schema: show tables/views directly
  if (isSingleDb && isSingleSchema) {
    const cacheKey = `${activeConnectionId}:${defaultSchema}`
    const allTables = tables.get(cacheKey) ?? []
    const filter = filterText.toLowerCase()
    const filteredTables = allTables.filter((t) => t.type === 'table' && t.name.toLowerCase().includes(filter))
    const filteredViews = allTables.filter((t) => t.type === 'view' && t.name.toLowerCase().includes(filter))

    return (
      <div>
        <ConnectionSwitcher />
        <SearchFilter />
        <div className="py-1">
          {filteredTables.length > 0 && (
            <div>
              <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider opacity-40 px-4 py-1">
                Tables
              </Text>
              {filteredTables.map((t) => (
                <TableNode key={t.name} tableName={t.name} connectionId={activeConnectionId} schema={defaultSchema} depth={0} onExportTable={onExportTable} />
              ))}
            </div>
          )}
          {filteredViews.length > 0 && (
            <div>
              <Text size="xs" color="muted" weight="medium" className="uppercase tracking-wider opacity-40 px-4 py-1">
                Views
              </Text>
              {filteredViews.map((v) => (
                <ViewNode key={v.name} viewName={v.name} connectionId={activeConnectionId} schema={defaultSchema} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Single-DB + multiple schemas: show schemas directly (skip DB level)
  if (isSingleDb) {
    return (
      <div>
        <ConnectionSwitcher />
        <SearchFilter />
        <div className="py-1">
          {schemaList.map((s) => (
            <SchemaNode key={s} schemaName={s} connectionId={activeConnectionId} depth={0} onExportTable={onExportTable} />
          ))}
        </div>
      </div>
    )
  }

  // Multiple databases: full hierarchy
  return (
    <div>
      <ConnectionSwitcher />
      <SearchFilter />
      <div className="py-1">
        {databaseList.map((db) => (
          <DatabaseNode key={db} databaseName={db} connectionId={activeConnectionId} depth={0} onExportTable={onExportTable} />
        ))}
        {databaseList.length === 0 && (
          <Text size="xs" color="muted" className="px-4 py-2">Loading databases…</Text>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/explorer/ExplorerTree.tsx
git commit -m "feat(explorer): create ExplorerTree with hierarchy flattening for single-db/schema engines"
```

---

### Task 10: Wire ExplorerTree into Sidebar and Delete Old Components

**Files:**
- Modify: `src/renderer/src/components/shell/Sidebar.tsx`
- Delete: `src/renderer/src/components/explorer/ConnectionsSection.tsx`
- Delete: `src/renderer/src/components/explorer/DatabasesSection.tsx`
- Delete: `src/renderer/src/components/explorer/TablesSection.tsx`
- Delete: `src/renderer/src/components/explorer/ViewsSection.tsx`

- [ ] **Step 1: Update Sidebar.tsx to use ExplorerTree**

Replace the old section imports and rendering in Sidebar.tsx. Remove the imports for `ConnectionsSection`, `DatabasesSection`, `TablesSection`, `ViewsSection`, and the `activeSchema`/`activeDatabase` state management. Replace the explorer panel content with a single `<ExplorerTree />`.

The key changes to Sidebar.tsx:

1. Remove imports: `ConnectionsSection`, `DatabasesSection`, `TablesSection`, `ViewsSection`, `SearchFilter`
2. Add import: `ExplorerTree` from `./explorer/ExplorerTree` (adjust path from shell/ to explorer/)
3. Remove local state: `activeSchema`, `activeDatabase`, and related useEffects
4. Replace the explorer panel section (the part inside `activePanel === 'explorer'`) with:

```tsx
{activePanel === 'explorer' && (
  <ExplorerTree onExportTable={(name) => setExportTable(name)} />
)}
```

5. Keep `exportTable`/`showImport` state and modals — those are still needed.

- [ ] **Step 2: Delete the old section components**

```bash
git rm src/renderer/src/components/explorer/ConnectionsSection.tsx
git rm src/renderer/src/components/explorer/DatabasesSection.tsx
git rm src/renderer/src/components/explorer/TablesSection.tsx
git rm src/renderer/src/components/explorer/ViewsSection.tsx
```

- [ ] **Step 3: Verify the app builds**

Run: `pnpm build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(explorer): wire ExplorerTree into Sidebar, delete old accordion sections"
```

---

### Task 11: Fix Any Remaining References to Old Store API

**Files:**
- Possibly modify: any file still referencing `expandedSections` or `toggleSection`

- [ ] **Step 1: Search for remaining references to old API**

Run: `grep -r "expandedSections\|toggleSection" src/renderer/src/ --include="*.tsx" --include="*.ts"`

Expected: No matches. If any remain, update them to use `expandedTreeNodes`/`toggleTreeNode`.

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: remove remaining references to old expandedSections API"
```

---

### Task 12: Run Dev Mode and Verify Visually

- [ ] **Step 1: Start the app in dev mode**

Run: `pnpm dev`

- [ ] **Step 2: Manual verification checklist**

Verify each of these in the running app:
1. Connection switcher dropdown shows all connections with status dots
2. Gear icon opens connection management
3. Connecting shows database tree
4. SQLite connections show tables/views directly (no DB/schema levels)
5. PostgreSQL connections show Database → Schema → Tables/Views hierarchy
6. Expanding a table shows contained card with columns, types, constraint badges
7. Row count pills appear on table headers
8. Hover actions (open, query) appear on table/view rows
9. Right-click context menus work on all node types
10. Search filter filters tables/views across the tree
11. No accordion sections visible anywhere in explorer

- [ ] **Step 3: Fix any issues found during manual testing, commit**

```bash
git add -A
git commit -m "fix: address visual/functional issues from manual testing"
```
