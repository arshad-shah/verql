# Plan 4: Data Charts & Query Plan Visualization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Recharts-powered data visualization (bar, line, pie, scatter) with auto chart-type detection from query results, plus a visual query execution plan viewer that parses EXPLAIN output into a tree.

**Architecture:** Charts render inline below the results grid via a toggle. A `chart-detect.ts` utility analyzes `QueryResult` fields to suggest the best chart type. The query plan viewer parses EXPLAIN ANALYZE output (PostgreSQL JSON format, MySQL tabular, SQLite text) into a tree of plan nodes, rendered as nested cards with cost bars.

**Tech Stack:** Recharts

---

## File Structure

```
dbstudio/src/renderer/src/
├── components/
│   ├── charts/
│   │   ├── ChartPanel.tsx            # CREATE — chart container with type selector + axis config
│   │   ├── chart-detect.ts           # CREATE — auto-detect best chart type from QueryResult
│   │   └── ChartView.tsx             # CREATE — renders the selected Recharts chart
│   ├── query-plan/
│   │   ├── QueryPlanView.tsx         # CREATE — parses EXPLAIN output and renders tree
│   │   └── PlanNode.tsx              # CREATE — single plan node with cost bar
│   └── results/
│       └── ResultsPanel.tsx          # CREATE — tabs: Grid | Chart | Plan (replaces inline results in QueryPanel)
├── lib/
│   └── plan-parser.ts               # CREATE — parse EXPLAIN ANALYZE output to tree structure
└── components/query/
    └── QueryPanel.tsx                # MODIFY — use ResultsPanel instead of inline results
```

---

### Task 1: Install Recharts

- [ ] **Step 1: Install**

```bash
cd /Users/ShahA/Documents/practice/dbterm/.worktrees/dbstudio/dbstudio
npm install recharts --save
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: install recharts"
```

---

### Task 2: Chart Detection Utility

**Files:**
- Create: `dbstudio/src/renderer/src/components/charts/chart-detect.ts`
- Test: `dbstudio/tests/unit/chart-detect.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/unit/chart-detect.test.ts
import { describe, it, expect } from 'vitest'
import type { FieldInfo } from '../../shared/types'

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'none'

function detectChartType(fields: FieldInfo[], rows: Record<string, unknown>[]): ChartType {
  if (fields.length < 2 || rows.length === 0) return 'none'

  const textFields = fields.filter(f => isTextField(f, rows))
  const numericFields = fields.filter(f => isNumericField(f, rows))
  const dateFields = fields.filter(f => isDateField(f, rows))

  if (dateFields.length >= 1 && numericFields.length >= 1) return 'line'
  if (textFields.length === 1 && numericFields.length === 1 && rows.length <= 15) return 'pie'
  if (textFields.length >= 1 && numericFields.length >= 1) return 'bar'
  if (numericFields.length >= 2) return 'scatter'
  return 'none'
}

function isTextField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.every(v => v === null || typeof v === 'string')
}

function isNumericField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.some(v => typeof v === 'number') && sample.every(v => v === null || typeof v === 'number')
}

function isDateField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const type = field.dataType.toLowerCase()
  if (/date|time|timestamp/.test(type)) return true
  const sample = rows.slice(0, 5).map(r => r[field.name])
  return sample.some(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).length > 8)
}

describe('Chart detection', () => {
  const textField: FieldInfo = { name: 'name', dataType: 'varchar', nullable: false }
  const numField: FieldInfo = { name: 'count', dataType: 'int', nullable: false }
  const dateField: FieldInfo = { name: 'created_at', dataType: 'timestamp', nullable: false }
  const numField2: FieldInfo = { name: 'total', dataType: 'numeric', nullable: false }

  it('detects bar chart for text + numeric', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Item ${i}`, count: i * 10 }))
    expect(detectChartType([textField, numField], rows)).toBe('bar')
  })

  it('detects line chart for date + numeric', () => {
    const rows = [
      { created_at: '2024-01-01', count: 10 },
      { created_at: '2024-02-01', count: 20 }
    ]
    expect(detectChartType([dateField, numField], rows)).toBe('line')
  })

  it('detects pie chart for text + numeric with few rows', () => {
    const rows = [
      { name: 'A', count: 30 },
      { name: 'B', count: 50 },
      { name: 'C', count: 20 }
    ]
    expect(detectChartType([textField, numField], rows)).toBe('pie')
  })

  it('detects scatter for two numeric fields', () => {
    const rows = [{ count: 10, total: 100 }, { count: 20, total: 200 }]
    expect(detectChartType([numField, numField2], rows)).toBe('scatter')
  })

  it('returns none for empty results', () => {
    expect(detectChartType([textField], [])).toBe('none')
  })

  it('returns none for single field', () => {
    expect(detectChartType([numField], [{ count: 1 }])).toBe('none')
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (tests inline functions, no imports needed yet)

```bash
npx vitest run tests/unit/chart-detect.test.ts
```

Expected: PASS — 6 tests.

- [ ] **Step 3: Create `chart-detect.ts`**

```typescript
// src/renderer/src/components/charts/chart-detect.ts
import type { FieldInfo } from '@shared/types'

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'none'

export function detectChartType(fields: FieldInfo[], rows: Record<string, unknown>[]): ChartType {
  if (fields.length < 2 || rows.length === 0) return 'none'

  const textFields = fields.filter(f => isTextField(f, rows))
  const numericFields = fields.filter(f => isNumericField(f, rows))
  const dateFields = fields.filter(f => isDateField(f, rows))

  if (dateFields.length >= 1 && numericFields.length >= 1) return 'line'
  if (textFields.length === 1 && numericFields.length === 1 && rows.length <= 15) return 'pie'
  if (textFields.length >= 1 && numericFields.length >= 1) return 'bar'
  if (numericFields.length >= 2) return 'scatter'
  return 'none'
}

export function isTextField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.every(v => v === null || typeof v === 'string')
}

export function isNumericField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.some(v => typeof v === 'number') && sample.every(v => v === null || typeof v === 'number')
}

export function isDateField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const type = field.dataType.toLowerCase()
  if (/date|time|timestamp/.test(type)) return true
  const sample = rows.slice(0, 5).map(r => r[field.name])
  return sample.some(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).length > 8)
}

export function suggestAxes(fields: FieldInfo[], rows: Record<string, unknown>[]): { x: string; y: string } | null {
  const textFields = fields.filter(f => isTextField(f, rows))
  const numericFields = fields.filter(f => isNumericField(f, rows))
  const dateFields = fields.filter(f => isDateField(f, rows))

  if (dateFields.length >= 1 && numericFields.length >= 1) {
    return { x: dateFields[0].name, y: numericFields[0].name }
  }
  if (textFields.length >= 1 && numericFields.length >= 1) {
    return { x: textFields[0].name, y: numericFields[0].name }
  }
  if (numericFields.length >= 2) {
    return { x: numericFields[0].name, y: numericFields[1].name }
  }
  return null
}
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/charts/chart-detect.ts tests/unit/chart-detect.test.ts && git commit -m "feat: add chart type auto-detection from query result shape"
```

---

### Task 3: Chart View Component

**Files:**
- Create: `dbstudio/src/renderer/src/components/charts/ChartView.tsx`

- [ ] **Step 1: Create `ChartView.tsx`**

```tsx
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { ChartType } from './chart-detect'

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd', '#56b6c2', '#d19a66']

interface Props {
  type: ChartType
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
}

export function ChartView({ type, data, xKey, yKey }: Props) {
  if (type === 'none' || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-text-muted text-sm">No chart available</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'bar' ? (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={yKey} fill="#7c6ff7" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : type === 'line' ? (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey={yKey} stroke="#7c6ff7" strokeWidth={2} dot={{ fill: '#7c6ff7', r: 3 }} />
        </LineChart>
      ) : type === 'pie' ? (
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="70%" label={{ fill: '#ccc', fontSize: 11 }}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
        </PieChart>
      ) : type === 'scatter' ? (
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <YAxis dataKey={yKey} name={yKey} tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a3e' }} />
          <Tooltip contentStyle={{ backgroundColor: '#12121f', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
          <Scatter data={data} fill="#7c6ff7" />
        </ScatterChart>
      ) : (
        <div />
      )}
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/charts/ChartView.tsx && git commit -m "feat: add ChartView component with bar, line, pie, scatter charts"
```

---

### Task 4: Chart Panel (container with type selector + axis config)

**Files:**
- Create: `dbstudio/src/renderer/src/components/charts/ChartPanel.tsx`

- [ ] **Step 1: Create `ChartPanel.tsx`**

```tsx
import { useState, useMemo } from 'react'
import { ChartView } from './ChartView'
import { detectChartType, suggestAxes, type ChartType } from './chart-detect'
import type { QueryResult } from '@shared/types'

interface Props {
  results: QueryResult
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' }
]

export function ChartPanel({ results }: Props) {
  const detected = useMemo(() => detectChartType(results.fields, results.rows), [results])
  const suggestedAxes = useMemo(() => suggestAxes(results.fields, results.rows), [results])

  const [chartType, setChartType] = useState<ChartType>(detected)
  const [xKey, setXKey] = useState(suggestedAxes?.x ?? results.fields[0]?.name ?? '')
  const [yKey, setYKey] = useState(suggestedAxes?.y ?? results.fields[1]?.name ?? '')

  if (results.fields.length < 2) {
    return <div className="flex items-center justify-center h-full text-text-muted text-sm">Need at least 2 columns to chart</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <div className="flex gap-1">
          {CHART_TYPES.map(ct => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${chartType === ct.value ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary border border-border'}`}
            >
              {ct.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs ml-auto">
          <label className="text-text-muted">X:</label>
          <select value={xKey} onChange={e => setXKey(e.target.value)} className="bg-bg-tertiary border border-border rounded px-2 py-0.5 text-xs text-text-primary">
            {results.fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label className="text-text-muted">Y:</label>
          <select value={yKey} onChange={e => setYKey(e.target.value)} className="bg-bg-tertiary border border-border rounded px-2 py-0.5 text-xs text-text-primary">
            {results.fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <ChartView type={chartType} data={results.rows} xKey={xKey} yKey={yKey} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/charts/ChartPanel.tsx && git commit -m "feat: add ChartPanel with type selector and axis configuration"
```

---

### Task 5: Query Plan Parser

**Files:**
- Create: `dbstudio/src/renderer/src/lib/plan-parser.ts`
- Test: `dbstudio/tests/unit/plan-parser.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/unit/plan-parser.test.ts
import { describe, it, expect } from 'vitest'

interface PlanNode {
  type: string
  table?: string
  cost: number
  rows: number
  actualTime?: number
  children: PlanNode[]
  details: string
}

function parsePlanText(text: string): PlanNode[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return []

  const nodes: PlanNode[] = []
  const stack: { node: PlanNode; indent: number }[] = []

  for (const line of lines) {
    const indent = line.search(/\S/)
    const match = line.trim().match(/^->?\s*(.+?)(?:\s+on\s+(\S+))?\s*\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+)/)

    if (!match) {
      const simpleMatch = line.trim().match(/^(\w[\w\s]+?)(?:\s+on\s+(\S+))?(?:\s*\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+))?/)
      if (simpleMatch) {
        const node: PlanNode = {
          type: simpleMatch[1].trim(),
          table: simpleMatch[2],
          cost: parseFloat(simpleMatch[3] ?? '0'),
          rows: parseInt(simpleMatch[4] ?? '0'),
          children: [],
          details: line.trim()
        }
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
        if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
        else nodes.push(node)
        stack.push({ node, indent })
      }
      continue
    }

    const node: PlanNode = {
      type: match[1].trim(),
      table: match[2],
      cost: parseFloat(match[3]),
      rows: parseInt(match[4]),
      children: [],
      details: line.trim()
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
    else nodes.push(node)
    stack.push({ node, indent })
  }

  return nodes
}

describe('Plan parser', () => {
  it('parses a simple PostgreSQL EXPLAIN output', () => {
    const text = `Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)`
    const nodes = parsePlanText(text)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Seq Scan')
    expect(nodes[0].table).toBe('users')
    expect(nodes[0].cost).toBe(1.50)
    expect(nodes[0].rows).toBe(50)
  })

  it('parses nested plan nodes', () => {
    const text = [
      'Hash Join  (cost=1.50..3.00 rows=100 width=200)',
      '  ->  Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)',
      '  ->  Hash  (cost=0.50..0.50 rows=10 width=50)',
      '        ->  Seq Scan on orders  (cost=0.00..0.50 rows=10 width=50)'
    ].join('\n')
    const nodes = parsePlanText(text)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Hash Join')
    expect(nodes[0].children).toHaveLength(2)
    expect(nodes[0].children[0].table).toBe('users')
    expect(nodes[0].children[1].type).toBe('Hash')
    expect(nodes[0].children[1].children).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(parsePlanText('')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test**

```bash
npx vitest run tests/unit/plan-parser.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 3: Create `plan-parser.ts`**

```typescript
// src/renderer/src/lib/plan-parser.ts

export interface PlanNode {
  type: string
  table?: string
  cost: number
  rows: number
  actualTime?: number
  children: PlanNode[]
  details: string
}

export function parsePlanText(text: string): PlanNode[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return []

  const nodes: PlanNode[] = []
  const stack: { node: PlanNode; indent: number }[] = []

  for (const line of lines) {
    const indent = line.search(/\S/)
    const match = line.trim().match(/^->?\s*(.+?)(?:\s+on\s+(\S+))?\s*\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+)/)

    if (!match) {
      const simpleMatch = line.trim().match(/^(\w[\w\s]+?)(?:\s+on\s+(\S+))?(?:\s*\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+))?/)
      if (simpleMatch) {
        const node: PlanNode = {
          type: simpleMatch[1].trim(),
          table: simpleMatch[2],
          cost: parseFloat(simpleMatch[3] ?? '0'),
          rows: parseInt(simpleMatch[4] ?? '0'),
          children: [],
          details: line.trim()
        }
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
        if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
        else nodes.push(node)
        stack.push({ node, indent })
      }
      continue
    }

    const node: PlanNode = {
      type: match[1].trim(),
      table: match[2],
      cost: parseFloat(match[3]),
      rows: parseInt(match[4]),
      children: [],
      details: line.trim()
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
    else nodes.push(node)
    stack.push({ node, indent })
  }

  return nodes
}

function findMaxCost(nodes: PlanNode[]): number {
  let max = 0
  for (const n of nodes) {
    if (n.cost > max) max = n.cost
    const childMax = findMaxCost(n.children)
    if (childMax > max) max = childMax
  }
  return max
}

export function parsePlanFromResult(rows: Record<string, unknown>[]): PlanNode[] {
  if (rows.length === 0) return []

  // PostgreSQL JSON format (EXPLAIN (FORMAT JSON))
  const firstRow = rows[0]
  const firstVal = Object.values(firstRow)[0]
  if (typeof firstVal === 'string' && firstVal.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(firstVal)
      if (Array.isArray(parsed) && parsed[0]?.Plan) {
        return [convertPgJsonPlan(parsed[0].Plan)]
      }
    } catch { /* not JSON */ }
  }

  // Text format — concatenate all rows' first column value
  const text = rows.map(r => String(Object.values(r)[0] ?? '')).join('\n')
  return parsePlanText(text)
}

function convertPgJsonPlan(plan: any): PlanNode {
  return {
    type: plan['Node Type'] ?? 'Unknown',
    table: plan['Relation Name'],
    cost: plan['Total Cost'] ?? 0,
    rows: plan['Plan Rows'] ?? 0,
    actualTime: plan['Actual Total Time'],
    children: (plan.Plans ?? []).map(convertPgJsonPlan),
    details: Object.entries(plan)
      .filter(([k]) => !['Plans', 'Node Type', 'Relation Name', 'Total Cost', 'Plan Rows'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  }
}

export { findMaxCost }
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/lib/plan-parser.ts tests/unit/plan-parser.test.ts && git commit -m "feat: add query plan parser for PostgreSQL/MySQL/SQLite EXPLAIN output"
```

---

### Task 6: Plan Node Component

**Files:**
- Create: `dbstudio/src/renderer/src/components/query-plan/PlanNode.tsx`

- [ ] **Step 1: Create `PlanNode.tsx`**

```tsx
import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PlanNode as PlanNodeType } from '@/lib/plan-parser'

interface Props {
  node: PlanNodeType
  maxCost: number
  depth?: number
}

function costColor(ratio: number): string {
  if (ratio < 0.3) return '#28c840'
  if (ratio < 0.6) return '#e5c07b'
  return '#ff5f57'
}

export function PlanNodeView({ node, maxCost, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true)
  const costRatio = maxCost > 0 ? node.cost / maxCost : 0
  const hasChildren = node.children.length > 0
  const color = costColor(costRatio)

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Node type badge */}
        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: color, color: costRatio > 0.3 ? '#000' : '#fff' }}>
          {node.type}
        </span>

        {node.table && <span className="text-xs text-info">{node.table}</span>}

        {/* Cost bar */}
        <div className="flex-1 mx-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(costRatio * 100, 2)}%`, backgroundColor: color }} />
        </div>

        <span className="text-xs text-text-muted shrink-0">cost: {node.cost.toFixed(1)}</span>
        <span className="text-xs text-text-muted shrink-0">rows: {node.rows}</span>
        {node.actualTime !== undefined && (
          <span className="text-xs text-warning shrink-0">{node.actualTime.toFixed(1)}ms</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <PlanNodeView key={i} node={child} maxCost={maxCost} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/query-plan/PlanNode.tsx && git commit -m "feat: add PlanNode component with cost bars and collapsible tree"
```

---

### Task 7: Query Plan View

**Files:**
- Create: `dbstudio/src/renderer/src/components/query-plan/QueryPlanView.tsx`

- [ ] **Step 1: Create `QueryPlanView.tsx`**

```tsx
import { useMemo } from 'react'
import { parsePlanFromResult, findMaxCost } from '@/lib/plan-parser'
import { PlanNodeView } from './PlanNode'
import type { QueryResult } from '@shared/types'

interface Props {
  results: QueryResult
}

export function QueryPlanView({ results }: Props) {
  const nodes = useMemo(() => parsePlanFromResult(results.rows), [results])
  const maxCost = useMemo(() => findMaxCost(nodes), [nodes])

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Run EXPLAIN ANALYZE to see the query plan
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-3">
      <div className="text-xs text-text-muted mb-3">
        Query Execution Plan · Max cost: {maxCost.toFixed(1)}
      </div>
      {nodes.map((node, i) => (
        <PlanNodeView key={i} node={node} maxCost={maxCost} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/query-plan/QueryPlanView.tsx && git commit -m "feat: add QueryPlanView component for visualizing EXPLAIN output"
```

---

### Task 8: Results Panel (Grid | Chart | Plan tabs)

**Files:**
- Create: `dbstudio/src/renderer/src/components/results/ResultsPanel.tsx`

- [ ] **Step 1: Create `ResultsPanel.tsx`**

```tsx
import { useState } from 'react'
import { ResultsGrid } from './ResultsGrid'
import { ResultsStatusBar } from './ResultsStatusBar'
import { ChartPanel } from '@/components/charts/ChartPanel'
import { QueryPlanView } from '@/components/query-plan/QueryPlanView'
import { Table2, BarChart3, GitBranch } from 'lucide-react'
import type { QueryResult } from '@shared/types'

type ResultTab = 'grid' | 'chart' | 'plan'

interface Props {
  results: QueryResult
}

export function ResultsPanel({ results }: Props) {
  const [activeTab, setActiveTab] = useState<ResultTab>('grid')

  const tabs: { id: ResultTab; label: string; icon: typeof Table2 }[] = [
    { id: 'grid', label: 'Grid', icon: Table2 },
    { id: 'chart', label: 'Chart', icon: BarChart3 },
    { id: 'plan', label: 'Plan', icon: GitBranch }
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-border bg-bg-secondary shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
              activeTab === id
                ? 'text-text-primary bg-white/10'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'grid' && (
          <>
            <ResultsGrid results={results} />
            <ResultsStatusBar results={results} />
          </>
        )}
        {activeTab === 'chart' && <ChartPanel results={results} />}
        {activeTab === 'plan' && <QueryPlanView results={results} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/results/ResultsPanel.tsx && git commit -m "feat: add ResultsPanel with Grid/Chart/Plan tab switching"
```

---

### Task 9: Update QueryPanel to Use ResultsPanel

**Files:**
- Modify: `dbstudio/src/renderer/src/components/query/QueryPanel.tsx`

- [ ] **Step 1: Replace inline results with ResultsPanel**

Replace the results section in `QueryPanel.tsx`. The full updated file:

```tsx
import { useCallback } from 'react'
import { QueryEditor } from './QueryEditor'
import { QueryToolbar } from './QueryToolbar'
import { ResultsPanel } from '@/components/results/ResultsPanel'
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
      <div className="flex-1 min-h-[120px] border-b border-border">
        <QueryEditor
          value={tab.sql}
          onChange={(sql) => updateTabSql(tab.id, sql)}
          onExecute={handleExecute}
          connectionId={tab.connectionId}
        />
      </div>

      <QueryToolbar
        onExecute={handleExecute}
        onCancel={handleCancel}
        onExplain={handleExplain}
        isExecuting={tab.isExecuting}
        duration={tab.results?.duration ?? null}
        rowCount={tab.results?.rowCount ?? null}
        error={tab.error}
      />

      <div className="flex-1 min-h-[100px] flex flex-col">
        {tab.results ? (
          <ResultsPanel results={tab.results} />
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

- [ ] **Step 2: Build and test**

```bash
npx electron-vite build
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/query/QueryPanel.tsx && git commit -m "feat: update QueryPanel to use ResultsPanel with Grid/Chart/Plan views"
```

---

## Plan Index

- **Plan 1:** ✅ Project scaffold, Electron shell, connection manager
- **Plan 2:** ✅ Query editor (Monaco) + execution + results grid (AG Grid)
- **Plan 3:** ✅ Schema browser + ER diagram (React Flow + Dagre)
- **Plan 4:** ✅ (this plan) Data charts (Recharts) + query plan visualization
- **Plan 5:** Import/export + cross-database migration
- **Plan 6:** Plugin system (npm-based + SDK)
- **Plan 7:** Polish — command palette, keybindings, settings
