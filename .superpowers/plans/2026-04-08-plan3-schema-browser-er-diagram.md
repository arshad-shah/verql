# Plan 3: Schema Browser & ER Diagram Visualization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schema tree browser in the sidebar (tables, columns, indexes) and an interactive ER diagram visualization using React Flow with Dagre auto-layout.

**Architecture:** Schema metadata is fetched via existing IPC channels (`db:get-tables`, `db:get-columns`, `db:get-indexes`, `db:get-schemas`). A Zustand `schema` store caches metadata per connection. The sidebar's "Explorer" panel shows a collapsible tree. The ER diagram renders in a tab using React Flow with custom table nodes and Dagre for auto-layout. Foreign key relationships become edges.

**Tech Stack:** @xyflow/react, @dagrejs/dagre

---

## File Structure

```
dbstudio/
├── src/renderer/src/
│   ├── stores/
│   │   └── schema.ts                       # CREATE — schema metadata cache store
│   ├── components/
│   │   ├── schema/
│   │   │   ├── SchemaTree.tsx               # CREATE — tree view of tables/columns
│   │   │   └── SchemaTreeItem.tsx           # CREATE — individual tree node
│   │   ├── er/
│   │   │   ├── ERDiagram.tsx                # CREATE — React Flow canvas + controls
│   │   │   ├── TableNode.tsx                # CREATE — custom node for table
│   │   │   └── er-layout.ts                # CREATE — Dagre layout logic
│   │   └── shell/
│   │       └── Sidebar.tsx                  # MODIFY — render SchemaTree in explorer
│   ├── App.tsx                              # MODIFY — render ER diagram tabs
│   └── stores/
│       └── tabs.ts                          # MODIFY — add openErDiagram action
├── shared/
│   └── types.ts                             # MODIFY — add ErDiagramTab type to Tab union
└── tests/unit/
    └── schema-store.test.ts                 # CREATE — schema store tests
```

---

### Task 1: Install React Flow and Dagre

**Files:**
- Modify: `dbstudio/package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/ShahA/Documents/practice/dbterm/.worktrees/dbstudio/dbstudio
npm install @xyflow/react @dagrejs/dagre --save
```

- [ ] **Step 2: Verify**

```bash
npm ls @xyflow/react @dagrejs/dagre
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: install @xyflow/react and @dagrejs/dagre"
```

---

### Task 2: Add ErDiagramTab Type

**Files:**
- Modify: `dbstudio/shared/types.ts`

- [ ] **Step 1: Add `ErDiagramTab` to shared types and update `Tab` union**

In `shared/types.ts`, add after the `TableTab` interface (before `export type Tab = ...`):

```typescript
export interface ErDiagramTab {
  id: string
  type: 'er-diagram'
  title: string
  connectionId: string
  schema: string
}
```

Then update the `Tab` union:

```typescript
export type Tab = QueryTab | TableTab | ErDiagramTab
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts && git commit -m "feat: add ErDiagramTab type"
```

---

### Task 3: Schema Store

**Files:**
- Create: `dbstudio/src/renderer/src/stores/schema.ts`
- Test: `dbstudio/tests/unit/schema-store.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/unit/schema-store.test.ts
import { describe, it, expect } from 'vitest'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '../../shared/types'

describe('Schema cache logic', () => {
  it('caches tables by connection+schema key', () => {
    const cache = new Map<string, SchemaTable[]>()
    const key = 'conn1:public'
    const tables: SchemaTable[] = [
      { name: 'users', schema: 'public', type: 'table' },
      { name: 'orders', schema: 'public', type: 'table' },
      { name: 'active_users', schema: 'public', type: 'view' }
    ]
    cache.set(key, tables)
    expect(cache.get(key)).toHaveLength(3)
    expect(cache.get(key)![2].type).toBe('view')
  })

  it('caches columns by connection+table key', () => {
    const cache = new Map<string, SchemaColumn[]>()
    const key = 'conn1:public.users'
    const columns: SchemaColumn[] = [
      { name: 'id', dataType: 'integer', nullable: false, defaultValue: null, isPrimaryKey: true, isForeignKey: false },
      { name: 'name', dataType: 'varchar', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
      { name: 'org_id', dataType: 'integer', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: true, references: { table: 'orgs', column: 'id' } }
    ]
    cache.set(key, columns)
    const fks = cache.get(key)!.filter(c => c.isForeignKey)
    expect(fks).toHaveLength(1)
    expect(fks[0].references!.table).toBe('orgs')
  })

  it('invalidates cache on refresh', () => {
    const cache = new Map<string, SchemaTable[]>()
    cache.set('conn1:public', [{ name: 'old', schema: 'public', type: 'table' }])
    cache.delete('conn1:public')
    expect(cache.get('conn1:public')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test**

```bash
npx vitest run tests/unit/schema-store.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 3: Create `src/renderer/src/stores/schema.ts`**

```typescript
import { create } from 'zustand'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

interface SchemaState {
  tables: Map<string, SchemaTable[]>
  columns: Map<string, SchemaColumn[]>
  indexes: Map<string, SchemaIndex[]>
  schemas: Map<string, string[]>
  expandedTables: Set<string>
  loading: boolean

  fetchSchemas: (connectionId: string) => Promise<string[]>
  fetchTables: (connectionId: string, schema: string) => Promise<SchemaTable[]>
  fetchColumns: (connectionId: string, table: string, schema: string) => Promise<SchemaColumn[]>
  fetchIndexes: (connectionId: string, table: string, schema: string) => Promise<SchemaIndex[]>
  toggleTable: (key: string) => void
  clearCache: (connectionId?: string) => void
}

function cacheKey(connectionId: string, ...parts: string[]): string {
  return [connectionId, ...parts].join(':')
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  tables: new Map(),
  columns: new Map(),
  indexes: new Map(),
  schemas: new Map(),
  expandedTables: new Set(),
  loading: false,

  fetchSchemas: async (connectionId) => {
    const key = connectionId
    const cached = get().schemas.get(key)
    if (cached) return cached
    set({ loading: true })
    const result = await window.electronAPI.invoke('db:get-schemas', connectionId)
    set((s) => {
      const next = new Map(s.schemas)
      next.set(key, result)
      return { schemas: next, loading: false }
    })
    return result
  },

  fetchTables: async (connectionId, schema) => {
    const key = cacheKey(connectionId, schema)
    const cached = get().tables.get(key)
    if (cached) return cached
    set({ loading: true })
    const result = await window.electronAPI.invoke('db:get-tables', connectionId, schema)
    set((s) => {
      const next = new Map(s.tables)
      next.set(key, result)
      return { tables: next, loading: false }
    })
    return result
  },

  fetchColumns: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    const cached = get().columns.get(key)
    if (cached) return cached
    const result = await window.electronAPI.invoke('db:get-columns', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.columns)
      next.set(key, result)
      return { columns: next }
    })
    return result
  },

  fetchIndexes: async (connectionId, table, schema) => {
    const key = cacheKey(connectionId, schema, table)
    const cached = get().indexes.get(key)
    if (cached) return cached
    const result = await window.electronAPI.invoke('db:get-indexes', connectionId, table, schema)
    set((s) => {
      const next = new Map(s.indexes)
      next.set(key, result)
      return { indexes: next }
    })
    return result
  },

  toggleTable: (key) => {
    set((s) => {
      const next = new Set(s.expandedTables)
      if (next.has(key)) next.delete(key); else next.add(key)
      return { expandedTables: next }
    })
  },

  clearCache: (connectionId) => {
    if (!connectionId) {
      set({ tables: new Map(), columns: new Map(), indexes: new Map(), schemas: new Map() })
      return
    }
    set((s) => {
      const filterMap = <T,>(m: Map<string, T>) => {
        const next = new Map<string, T>()
        for (const [k, v] of m) if (!k.startsWith(connectionId)) next.set(k, v)
        return next
      }
      return {
        tables: filterMap(s.tables),
        columns: filterMap(s.columns),
        indexes: filterMap(s.indexes),
        schemas: filterMap(s.schemas)
      }
    })
  }
}))
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/stores/schema.ts tests/unit/schema-store.test.ts && git commit -m "feat: add schema metadata cache store"
```

---

### Task 4: Schema Tree Components

**Files:**
- Create: `dbstudio/src/renderer/src/components/schema/SchemaTreeItem.tsx`
- Create: `dbstudio/src/renderer/src/components/schema/SchemaTree.tsx`

- [ ] **Step 1: Create `SchemaTreeItem.tsx`**

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
  children?: React.ReactNode
}

export function SchemaTreeItem({ label, icon, depth = 0, expanded, onToggle, onClick, children }: Props) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 14

  return (
    <div>
      <div
        onClick={() => { onToggle?.(); onClick?.() }}
        className="flex items-center gap-1.5 py-0.5 px-1 cursor-pointer text-xs hover:bg-white/5 rounded transition-colors"
        style={{ paddingLeft }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="text-text-muted shrink-0" /> : <ChevronRight size={12} className="text-text-muted shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate text-text-secondary">{label}</span>
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
```

- [ ] **Step 2: Create `SchemaTree.tsx`**

```tsx
import { useEffect } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { SchemaTreeItem, TableIcon, ColumnIcon } from './SchemaTreeItem'
import { GitFork, RefreshCw } from 'lucide-react'

export function SchemaTree() {
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()
  const { tables, columns, schemas, expandedTables, fetchSchemas, fetchTables, fetchColumns, toggleTable, clearCache } = useSchemaStore()
  const { addQueryTab } = useTabsStore()

  const connectionId = activeConnectionId
  const isConnected = connectionId && connectedIds.has(connectionId)
  const conn = connections.find(c => c.id === connectionId)

  useEffect(() => {
    if (!isConnected || !connectionId) return
    fetchSchemas(connectionId).then(schemaList => {
      const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
      fetchTables(connectionId, defaultSchema)
    })
  }, [connectionId, isConnected])

  if (!isConnected || !connectionId) {
    return <p className="text-text-muted text-xs px-3 py-6 text-center">Connect to browse schema</p>
  }

  const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn?.database ?? '' : 'public'
  const tableKey = `${connectionId}:${defaultSchema}`
  const tableList = tables.get(tableKey) ?? []

  const handleExpandTable = async (tableName: string) => {
    const key = `${connectionId}:${defaultSchema}:${tableName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, tableName, defaultSchema)
    }
  }

  const handleRefresh = () => {
    clearCache(connectionId)
    fetchSchemas(connectionId).then(() => fetchTables(connectionId, defaultSchema))
  }

  return (
    <div className="py-1">
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-xs text-text-muted">{defaultSchema}</span>
        <button onClick={handleRefresh} className="text-text-muted hover:text-text-primary transition-colors" title="Refresh">
          <RefreshCw size={11} />
        </button>
      </div>

      {tableList.length === 0 && (
        <p className="text-text-muted text-xs px-3 py-4 text-center">No tables found</p>
      )}

      {tableList.map(table => {
        const colKey = `${connectionId}:${defaultSchema}:${table.name}`
        const isExpanded = expandedTables.has(colKey)
        const cols = columns.get(colKey) ?? []

        return (
          <SchemaTreeItem
            key={table.name}
            label={table.name}
            icon={<TableIcon type={table.type} />}
            depth={0}
            expanded={isExpanded}
            onToggle={() => handleExpandTable(table.name)}
          >
            {cols.map(col => (
              <SchemaTreeItem
                key={col.name}
                label={`${col.name} ${col.dataType}`}
                icon={<ColumnIcon column={col} />}
                depth={1}
              />
            ))}
          </SchemaTreeItem>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/schema/ && git commit -m "feat: add schema tree browser with table/column/index display"
```

---

### Task 5: ER Diagram — Layout Engine

**Files:**
- Create: `dbstudio/src/renderer/src/components/er/er-layout.ts`

- [ ] **Step 1: Create `er-layout.ts`**

```typescript
import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 220
const NODE_HEIGHT_BASE = 40
const NODE_HEIGHT_PER_COLUMN = 22

export interface TableNodeData {
  tableName: string
  columns: { name: string; dataType: string; isPrimaryKey: boolean; isForeignKey: boolean }[]
  color: string
}

export function layoutErDiagram(
  nodes: Node<TableNodeData>[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 })

  nodes.forEach((node) => {
    const height = NODE_HEIGHT_BASE + (node.data.columns.length * NODE_HEIGHT_PER_COLUMN)
    g.setNode(node.id, { width: NODE_WIDTH, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const isHorizontal = direction === 'LR'
  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    const height = NODE_HEIGHT_BASE + (node.data.columns.length * NODE_HEIGHT_PER_COLUMN)
    return {
      ...node,
      targetPosition: isHorizontal ? ('left' as const) : ('top' as const),
      sourcePosition: isHorizontal ? ('right' as const) : ('bottom' as const),
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - height / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

const TABLE_COLORS = [
  '#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd',
  '#56b6c2', '#d19a66', '#98c379', '#e06c75'
]

export function buildErElements(
  tables: { name: string; columns: { name: string; dataType: string; isPrimaryKey: boolean; isForeignKey: boolean; references?: { table: string; column: string } }[] }[]
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const tableSet = new Set(tables.map(t => t.name))

  const nodes: Node<TableNodeData>[] = tables.map((table, i) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: 0, y: 0 },
    data: {
      tableName: table.name,
      columns: table.columns.map(c => ({
        name: c.name,
        dataType: c.dataType,
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: c.isForeignKey
      })),
      color: TABLE_COLORS[i % TABLE_COLORS.length]
    }
  }))

  const edges: Edge[] = []
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.isForeignKey && col.references && tableSet.has(col.references.table)) {
        edges.push({
          id: `${table.name}.${col.name}->${col.references.table}.${col.references.column}`,
          source: table.name,
          target: col.references.table,
          label: `${col.name} → ${col.references.column}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#7c6ff7', strokeWidth: 1.5 },
          labelStyle: { fontSize: 9, fill: '#888' }
        })
      }
    }
  }

  return { nodes, edges }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/er/er-layout.ts && git commit -m "feat: add Dagre-based ER diagram layout engine"
```

---

### Task 6: Custom Table Node Component

**Files:**
- Create: `dbstudio/src/renderer/src/components/er/TableNode.tsx`

- [ ] **Step 1: Create `TableNode.tsx`**

```tsx
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Key, Link } from 'lucide-react'
import type { TableNodeData } from './er-layout'

function TableNodeComponent({ data }: NodeProps) {
  const { tableName, columns, color } = data as TableNodeData

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden shadow-lg min-w-[200px]" style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} className="!bg-accent !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-accent !w-2 !h-2" />

      <div className="px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
        {tableName}
      </div>

      <div className="divide-y divide-border">
        {columns.map((col) => (
          <div key={col.name} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px]">
            {col.isPrimaryKey ? (
              <Key size={10} className="text-warning shrink-0" />
            ) : col.isForeignKey ? (
              <Link size={10} className="text-info shrink-0" />
            ) : (
              <span className="w-2.5 shrink-0" />
            )}
            <span className="text-text-primary">{col.name}</span>
            <span className="text-text-muted ml-auto">{col.dataType}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/er/TableNode.tsx && git commit -m "feat: add custom TableNode component for ER diagram"
```

---

### Task 7: ER Diagram Component

**Files:**
- Create: `dbstudio/src/renderer/src/components/er/ERDiagram.tsx`

- [ ] **Step 1: Create `ERDiagram.tsx`**

```tsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableNode } from './TableNode'
import { buildErElements, layoutErDiagram, type TableNodeData } from './er-layout'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { Loader2, LayoutGrid } from 'lucide-react'

const nodeTypes = { tableNode: TableNode }

interface Props {
  connectionId: string
  schema: string
}

export function ERDiagram({ connectionId, schema }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const { fetchTables, fetchColumns } = useSchemaStore()
  const { connections } = useConnectionsStore()
  const conn = connections.find(c => c.id === connectionId)

  useEffect(() => {
    let cancelled = false

    async function loadSchema() {
      setLoading(true)
      const tables = await fetchTables(connectionId, schema)

      const tablesWithColumns = await Promise.all(
        tables.filter(t => t.type === 'table').map(async (table) => {
          const columns = await fetchColumns(connectionId, table.name, schema)
          return { name: table.name, columns }
        })
      )

      if (cancelled) return

      const { nodes: rawNodes, edges: rawEdges } = buildErElements(tablesWithColumns)
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutErDiagram(rawNodes, rawEdges, direction)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      setLoading(false)
    }

    loadSchema()
    return () => { cancelled = true }
  }, [connectionId, schema])

  const handleRelayout = useCallback((dir: 'LR' | 'TB') => {
    setDirection(dir)
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutErDiagram(nodes, edges, dir)
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])
  }, [nodes, edges, setNodes, setEdges])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-tertiary">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-tertiary text-text-muted text-sm">
        No tables found in schema "{schema}"
      </div>
    )
  }

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a3e" gap={20} size={1} />
        <Controls
          position="bottom-right"
          className="!bg-bg-secondary !border-border !shadow-lg [&>button]:!bg-bg-secondary [&>button]:!border-border [&>button]:!text-text-secondary [&>button:hover]:!bg-white/5"
        />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => (n.data as TableNodeData)?.color ?? '#7c6ff7'}
          maskColor="rgba(0,0,0,0.7)"
          className="!bg-bg-secondary !border-border"
        />
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          <button
            onClick={() => handleRelayout('LR')}
            className={`px-2 py-1 text-xs rounded border transition-colors ${direction === 'LR' ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-muted hover:text-text-primary'}`}
          >
            Horizontal
          </button>
          <button
            onClick={() => handleRelayout('TB')}
            className={`px-2 py-1 text-xs rounded border transition-colors ${direction === 'TB' ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-muted hover:text-text-primary'}`}
          >
            Vertical
          </button>
        </div>
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/er/ERDiagram.tsx && git commit -m "feat: add ER diagram component with React Flow, Dagre layout, and minimap"
```

---

### Task 8: Wire Up Sidebar, Tabs, and App

**Files:**
- Modify: `dbstudio/src/renderer/src/stores/tabs.ts`
- Modify: `dbstudio/src/renderer/src/components/shell/Sidebar.tsx`
- Modify: `dbstudio/src/renderer/src/App.tsx`

- [ ] **Step 1: Add `openErDiagram` action to tabs store**

In `src/renderer/src/stores/tabs.ts`, add to the `TabsState` interface:

```typescript
  openErDiagram: (connectionId: string, schema: string) => string
```

Add the implementation inside the `create` call, after `getActiveTab`:

```typescript
  openErDiagram: (connectionId, schema) => {
    const id = `er-${connectionId}-${schema}`
    const existing = get().tabs.find(t => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: import('@shared/types').ErDiagramTab = {
      id,
      type: 'er-diagram',
      title: `ER: ${schema}`,
      connectionId,
      schema
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id
    }))
    return id
  }
```

- [ ] **Step 2: Update Sidebar to add ER diagram button and schema tree**

Replace `src/renderer/src/components/shell/Sidebar.tsx`:

```tsx
import { useUiStore } from '@/stores/ui'
import { ConnectionList } from '@/components/connections/ConnectionList'
import { SchemaTree } from '@/components/schema/SchemaTree'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { PenSquare, GitFork } from 'lucide-react'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()
  const { addQueryTab, openErDiagram } = useTabsStore()

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    schema: 'Schema',
    charts: 'Charts',
    extensions: 'Extensions'
  }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)
  const conn = connections.find(c => c.id === activeConnectionId)

  const handleOpenErDiagram = () => {
    if (!activeConnectionId || !conn) return
    const schema = conn.type === 'sqlite' ? 'main' : conn.type === 'mysql' ? conn.database : 'public'
    openErDiagram(activeConnectionId, schema)
  }

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>{titles[activePanel] ?? 'Explorer'}</span>
        {isConnected && activePanel === 'explorer' && (
          <div className="flex items-center gap-1">
            <button onClick={handleOpenErDiagram} className="text-text-muted hover:text-accent transition-colors" title="ER Diagram">
              <GitFork size={12} />
            </button>
            <button onClick={() => addQueryTab(activeConnectionId)} className="text-text-muted hover:text-accent transition-colors" title="New Query">
              <PenSquare size={12} />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'explorer' && (
          <>
            <ConnectionList />
            {isConnected && (
              <div className="border-t border-border mt-1 pt-1">
                <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Schema</div>
                <SchemaTree />
              </div>
            )}
          </>
        )}
        {activePanel !== 'explorer' && (
          <p className="text-text-muted text-sm px-2 py-8 text-center">Coming soon</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `App.tsx` to render ER diagram tabs**

Replace `src/renderer/src/App.tsx`:

```tsx
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/TabBar'
import { QueryPanel } from '@/components/query/QueryPanel'
import { ERDiagram } from '@/components/er/ERDiagram'
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab, ErDiagramTab } from '@shared/types'

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
            {activeTab?.type === 'er-diagram' && (
              <ERDiagram
                connectionId={(activeTab as ErDiagramTab).connectionId}
                schema={(activeTab as ErDiagramTab).schema}
              />
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

- [ ] **Step 4: Build and test**

```bash
npx electron-vite build
npx vitest run
```

Expected: All bundles build, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/ shared/ && git commit -m "feat: wire up schema tree in sidebar, ER diagram tabs in App"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Build**

```bash
npx electron-vite build
```

Expected: All 3 bundles build cleanly.

- [ ] **Step 3: Commit if needed**

```bash
git add -A && git status
```

If changes exist: `git commit -m "chore: plan 3 complete — schema browser and ER diagram"`

---

## Plan Index

- **Plan 1:** ✅ Project scaffold, Electron shell, connection manager
- **Plan 2:** ✅ Query editor (Monaco) + execution + results grid (AG Grid)
- **Plan 3:** ✅ (this plan) Schema browser + ER diagram (React Flow + Dagre)
- **Plan 4:** Data charts (Recharts) + query plan visualization
- **Plan 5:** Import/export + cross-database migration
- **Plan 6:** Plugin system (npm-based + SDK)
- **Plan 7:** Polish — command palette, keybindings, settings
