import blessed from 'blessed'
import contrib from 'blessed-contrib'
import type { DbAdapter } from '../db/adapter.js'
import type { DbType } from '../config/store.js'

// ─── Fullscreen result viewer ────────────────────────────────────────────────
// Blessed-based interactive table with scrolling, column resizing, search

export async function showResultsFullscreen(
  columns: string[],
  rows: Record<string, any>[],
  title = 'Query Results',
): Promise<void> {
  if (columns.length === 0 || rows.length === 0) return

  const screen = blessed.screen({
    smartCSR: true,
    title: `dbterm — ${title}`,
    fullUnicode: true,
  })

  const headers = columns
  const data = rows.map((r) => columns.map((c) => formatVal(r[c])))
  const colWidths = computeColWidths(headers, data, screen.width as number)

  const table = contrib.table({
    keys: true,
    vi: true,
    mouse: true,
    label: ` ${title} (${rows.length} rows) — q to close, ↑↓ scroll `,
    columnWidth: colWidths,
    columnSpacing: 2,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      header: { fg: 'brightcyan', bold: true },
      cell: { fg: 'white' },
    },
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    interactive: true,
    selectedFg: 'black',
    selectedBg: 'cyan',
  } as any)

  screen.append(table)
  table.setData({ headers, data })
  table.focus()

  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ` {cyan-fg}${rows.length}{/} rows · {cyan-fg}${columns.length}{/} columns · q: close · ↑↓: scroll · Tab: next col`,
    tags: true,
    style: { fg: 'white', bg: 'black' },
  })
  screen.append(statusBar)

  screen.key(['q', 'escape'], () => { screen.destroy(); })
  screen.render()

  return new Promise<void>((resolve) => {
    screen.on('destroy', () => resolve())
  })
}

// ─── Diagnostics dashboard ───────────────────────────────────────────────────

interface DashboardData {
  dbSize: string
  tableCount: number
  connectionCount: number
  maxConnections: number
  cacheHitPct: number
  tableSizes: Array<{ name: string; bytes: number }>
  bloatData: Array<{ name: string; pct: number }>
  connectionsByState: Array<{ state: string; count: number }>
}

export async function showDiagnosticsDashboard(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<void> {
  const data = await loadDashboardData(adapter, schema, dbType)
  if (!data) return

  const screen = blessed.screen({
    smartCSR: true,
    title: 'dbterm — Diagnostics Dashboard',
    fullUnicode: true,
  })

  const grid = new contrib.grid({ rows: 12, cols: 12, screen })

  // ── Top left: Overview box
  const infoBox = grid.set(0, 0, 4, 4, blessed.box, {
    label: ' Overview ',
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    content: [
      ` Database size: {cyan-fg}${data.dbSize}{/}`,
      ` Tables:        {cyan-fg}${data.tableCount}{/}`,
      ` Connections:   {cyan-fg}${data.connectionCount} / ${data.maxConnections}{/}`,
      ` Cache hit:     {cyan-fg}${data.cacheHitPct.toFixed(1)}%{/}`,
    ].join('\n'),
  })

  // ── Top center: Cache gauge
  const gauge = grid.set(0, 4, 4, 4, contrib.gauge, {
    label: ' Cache Hit Ratio ',
    stroke: data.cacheHitPct > 90 ? 'green' : data.cacheHitPct > 70 ? 'yellow' : 'red',
    fill: 'white',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
  })
  gauge.setPercent(data.cacheHitPct)

  // ── Top right: Connections donut
  if (data.connectionsByState.length > 0 && dbType !== 'sqlite') {
    const donut = grid.set(0, 8, 4, 4, contrib.donut, {
      label: ' Connections by State ',
      radius: 8,
      arcWidth: 3,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
    })
    const connColors = ['green', 'cyan', 'yellow', 'red', 'magenta', 'blue']
    donut.setData(data.connectionsByState.map((c, i) => ({
      label: c.state ?? 'other',
      percent: Math.round((c.count / Math.max(data.connectionCount, 1)) * 100),
      color: connColors[i % connColors.length],
    })))
  }

  // ── Middle: Table sizes bar chart
  if (data.tableSizes.length > 0) {
    const maxTables = Math.min(data.tableSizes.length, 12)
    const bar = grid.set(4, 0, 4, 8, contrib.bar, {
      label: ' Table Sizes (top) ',
      barWidth: 6,
      barSpacing: 2,
      xOffset: 2,
      barBgColor: 'cyan',
      barFgColor: 'white',
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
    } as any)
    const topTables = data.tableSizes.slice(0, maxTables)
    bar.setData({
      titles: topTables.map((t) => t.name.slice(0, 8)),
      data: topTables.map((t) => Math.round(t.bytes / 1024)),
    })
  }

  // ── Middle right: Bloat sparkline
  if (data.bloatData.length > 0) {
    const spark = grid.set(4, 8, 4, 4, contrib.sparkline, {
      label: ' Bloat % by Table ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'cyan', border: { fg: 'cyan' } },
    })
    spark.setData(
      [data.bloatData.map((b) => b.name.slice(0, 6)).join(' ')],
      [data.bloatData.map((b) => b.pct)],
    )
  }

  // ── Bottom: Status bar
  const status = grid.set(11, 0, 1, 12, blessed.box, {
    content: ` {cyan-fg}dbterm diagnostics{/} · ${dbType} · ${schema} · q: close · r: refresh`,
    tags: true,
    style: { fg: 'white', bg: 'black' },
  })

  screen.key(['q', 'escape'], () => { screen.destroy() })
  screen.key(['r'], async () => {
    const newData = await loadDashboardData(adapter, schema, dbType)
    if (newData) {
      gauge.setPercent(newData.cacheHitPct)
      screen.render()
    }
  })

  screen.render()

  return new Promise<void>((resolve) => {
    screen.on('destroy', () => resolve())
  })
}

// ─── Schema tree browser ─────────────────────────────────────────────────────

export async function showSchemaTree(
  adapter: DbAdapter,
  schema: string,
): Promise<string | null> {
  const tables = await adapter.getTables(schema).catch(() => [])
  if (tables.length === 0) return null

  const screen = blessed.screen({
    smartCSR: true,
    title: 'dbterm — Schema Browser',
    fullUnicode: true,
  })

  const treeData: Record<string, any> = { name: schema, extended: true, children: {} }
  for (const t of tables) {
    const cols = await adapter.getColumns(t.name, schema).catch(() => [])
    const children: Record<string, any> = {}
    for (const c of cols) {
      const label = `${c.name} (${c.type})${c.isPrimaryKey ? ' PK' : ''}${c.nullable ? '' : ' NOT NULL'}`
      children[label] = {}
    }
    const icon = t.type === 'view' ? '⬡' : '◈'
    const rowLabel = t.rowCount != null ? ` [${t.rowCount}]` : ''
    treeData.children[`${icon} ${t.name}${rowLabel}`] = { children }
  }

  const tree = contrib.tree({
    label: ` Schema: ${schema} — ${tables.length} tables · q: close · Enter: select `,
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'cyan' },
      selected: { fg: 'black', bg: 'cyan' },
    },
    width: '100%',
    height: '100%',
    keys: true,
    vi: true,
    mouse: true,
  } as any)

  screen.append(tree)
  tree.setData(treeData)
  tree.focus()

  let selected: string | null = null

  screen.key(['q', 'escape'], () => { screen.destroy() })
  tree.on('select', (node: any) => {
    const name = node.name?.replace(/^[⬡◈]\s*/, '').replace(/\s*\[.*\]$/, '')
    if (tables.some((t) => t.name === name)) {
      selected = name
      screen.destroy()
    }
  })

  screen.render()

  return new Promise<string | null>((resolve) => {
    screen.on('destroy', () => resolve(selected))
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVal(v: any): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function computeColWidths(headers: string[], data: string[][], screenWidth: number): number[] {
  const widths = headers.map((h, i) => {
    const maxData = data.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0)
    return Math.min(Math.max(h.length, maxData, 4), 40)
  })
  // Shrink if total is too wide
  const total = widths.reduce((a, b) => a + b + 2, 0)
  if (total > screenWidth - 4) {
    const budget = screenWidth - 4 - headers.length * 2
    const share = Math.max(4, Math.floor(budget / headers.length))
    return widths.map((w) => Math.min(w, share))
  }
  return widths
}

async function loadDashboardData(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<DashboardData | null> {
  try {
    const tables = await adapter.getTables(schema)
    const q = async (sql: string) => {
      const res = await adapter.query(sql)
      return res.error ? [] : res.rows
    }

    if (dbType === 'postgresql') {
      const ov = await q(`SELECT pg_size_pretty(pg_database_size(current_database())) as size,
        (SELECT count(*) FROM pg_stat_activity) as conns,
        (SELECT setting FROM pg_settings WHERE name='max_connections') as max_conn`)
      const cache = await q(`SELECT round(sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit)+sum(heap_blks_read),0)*100,2) as pct FROM pg_statio_user_tables`)
      const sizes = await q(`SELECT relname as name, pg_total_relation_size(relid) as bytes FROM pg_stat_user_tables WHERE schemaname='${schema}' ORDER BY bytes DESC`)
      const bloat = await q(`SELECT relname as name, round(n_dead_tup::numeric/nullif(n_live_tup+n_dead_tup,0)*100,2) as pct FROM pg_stat_user_tables WHERE schemaname='${schema}'`)
      const conns = await q(`SELECT state, count(*)::int as count FROM pg_stat_activity GROUP BY state`)
      return {
        dbSize: ov[0]?.size ?? '?', tableCount: tables.length,
        connectionCount: Number(ov[0]?.conns ?? 0), maxConnections: Number(ov[0]?.max_conn ?? 100),
        cacheHitPct: Number(cache[0]?.pct ?? 0),
        tableSizes: sizes.map((r: any) => ({ name: r.name, bytes: Number(r.bytes) })),
        bloatData: bloat.filter((r: any) => Number(r.pct) > 0).map((r: any) => ({ name: r.name, pct: Number(r.pct) })),
        connectionsByState: conns.map((r: any) => ({ state: r.state, count: Number(r.count) })),
      }
    }

    if (dbType === 'mysql') {
      const size = await q(`SELECT round(sum(data_length+index_length)/1024/1024,2) as mb FROM information_schema.tables WHERE table_schema=DATABASE()`)
      const threads = await q(`SHOW STATUS LIKE 'Threads_connected'`)
      const maxConn = await q(`SHOW VARIABLES LIKE 'max_connections'`)
      const sizes = await q(`SELECT table_name as name, data_length+index_length as bytes FROM information_schema.tables WHERE table_schema=DATABASE() ORDER BY bytes DESC`)
      const bloat = await q(`SELECT table_name as name, round((data_free/nullif(data_length+index_length+data_free,0))*100,2) as pct FROM information_schema.tables WHERE table_schema=DATABASE()`)
      const conns = await q(`SELECT command as state, count(*) as count FROM information_schema.processlist GROUP BY command`)
      return {
        dbSize: `${size[0]?.mb ?? '?'} MB`, tableCount: tables.length,
        connectionCount: Number(threads[0]?.Value ?? 0), maxConnections: Number(maxConn[0]?.Value ?? 100),
        cacheHitPct: 0,
        tableSizes: sizes.map((r: any) => ({ name: r.name, bytes: Number(r.bytes) })),
        bloatData: bloat.filter((r: any) => Number(r.pct) > 0).map((r: any) => ({ name: r.name, pct: Number(r.pct) })),
        connectionsByState: conns.map((r: any) => ({ state: r.state, count: Number(r.count) })),
      }
    }

    // SQLite
    const info = await adapter.getServerInfo()
    return {
      dbSize: info.size ?? '?', tableCount: tables.length,
      connectionCount: 1, maxConnections: 1, cacheHitPct: 100,
      tableSizes: [], bloatData: [], connectionsByState: [],
    }
  } catch {
    return null
  }
}
