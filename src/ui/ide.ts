// ─── dbterm IDE ───────────────────────────────────────────────────────────────
// Full-screen blessed IDE with:
//   ┌─ Menu Bar ──────────────────────────────────────────────────┐
//   │ [F1 Help] [F2 Info] [F3 Schema] [F5 Run] [F9 Diag] [F10 Exit]│
//   ├─ Schema Tree ──────┬─ SQL Editor ───────────────────────────┤
//   │ ▸ public           │ SELECT ...                             │
//   ├────────────────────┴─ Results ──────────────────────────────┤
//   │  col1 │ col2 │                                             │
//   └─ Status bar ────────────────────────────────────────────────┘

import blessed from 'blessed'
import contrib from 'blessed-contrib'
import type { DbAdapter, TableInfo } from '../db/adapter.js'
import type { Connection } from '../config/store.js'
import { addToHistory, getHistory } from '../config/store.js'
import { theme, highlightSQL } from './theme.js'
import { quoteIdent } from '../utils/sql.js'
import { showDiagnosticsDashboard } from './dashboard.js'

interface IDEState {
  adapter: DbAdapter
  conn: Connection
  currentSchema: string
  schemas: string[]
  tables: TableInfo[]
  lastResult: { columns: string[]; rows: Record<string, any>[] } | null
  lastQueryTime: number | null
  isRunning: boolean
}

function formatVal(v: any): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function buildMenuContent(): string {
  return (
    '  {bold}{cyan-fg}F1{/} Help' +
    '   {bold}{cyan-fg}F2{/} Info' +
    '   {bold}{cyan-fg}F3{/} Refresh' +
    '   {bold}{cyan-fg}F5{/} Run SQL' +
    '   {bold}{cyan-fg}F7{/} History' +
    '   {bold}{cyan-fg}F8{/} Snippets' +
    '   {bold}{cyan-fg}F9{/} Diagnostics' +
    '   {bold}{cyan-fg}F10{/} Exit'
  )
}

function buildStatusContent(state: IDEState): string {
  const txnBadge = state.adapter?.isInTransaction() ? '  {yellow-fg}⚡ TXN{/}' : ''
  const connInfo =
    `{cyan-fg}${state.conn.name}{/}` +
    `  {grey-fg}(${state.conn.type}){/}` +
    `  {grey-fg}schema:${state.currentSchema}{/}`
  const resultInfo = state.lastResult
    ? `  {green-fg}${state.lastResult.rows.length} rows{/}` +
      (state.lastQueryTime != null ? `  {grey-fg}${state.lastQueryTime}ms{/}` : '')
    : ''
  return ` ${connInfo}${txnBadge}${resultInfo}   {grey-fg}Tab:switch panel · F5:run · F10:exit{/}`
}

// ─── Modal helpers ────────────────────────────────────────────────────────────

function blessedPrompt(
  screen: blessed.Widgets.Screen,
  label: string,
  defaultValue = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    const prompt = blessed.prompt({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      label: ` ${label} `,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
    } as any)
    ;(prompt as any).input(label, defaultValue, (err: any, value: string | null) => {
      screen.remove(prompt)
      resolve(err ? null : value)
    })
    screen.render()
  })
}

function blessedConfirm(
  screen: blessed.Widgets.Screen,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const question = blessed.question({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      label: ' Confirm ',
      border: { type: 'line' },
      style: { border: { fg: 'yellow' } },
    } as any)
    ;(question as any).ask(message, (err: any, answer: boolean) => {
      screen.remove(question)
      resolve(!err && answer)
    })
    screen.render()
  })
}

function blessedMessage(
  screen: blessed.Widgets.Screen,
  text: string,
  delay = 2,
): Promise<void> {
  return new Promise((resolve) => {
    const msg = blessed.message({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 'shrink',
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
    } as any)
    ;(msg as any).display(text, delay, () => {
      screen.remove(msg)
      screen.render()
      resolve()
    })
    screen.render()
  })
}

// ─── Schema loader ────────────────────────────────────────────────────────────

async function loadSchemaTree(
  state: IDEState,
  tree: any,
): Promise<void> {
  try {
    state.tables = await state.adapter.getTables(state.currentSchema)
    state.schemas = await state.adapter.getSchemas().catch(() => [state.currentSchema])

    const children: Record<string, any> = {}
    for (const t of state.tables) {
      const icon = t.type === 'view' ? '⬡' : '◈'
      const rowLabel = t.rowCount != null ? ` [${t.rowCount}]` : ''
      children[`${icon} ${t.name}${rowLabel}`] = { children: {} }
    }

    tree.setData({
      extended: true,
      name: state.currentSchema,
      children,
    })
    tree.setLabel(` Schema: ${state.currentSchema} (${state.tables.length}) `)
  } catch (err: any) {
    tree.setLabel(` Schema: ${state.currentSchema} (load failed) `)
    tree.setData({ extended: false, name: `Error: ${err.message}`, children: {} })
  }
}

// ─── Schema picker modal ──────────────────────────────────────────────────────

function showSchemaPicker(
  screen: blessed.Widgets.Screen,
  state: IDEState,
  tree: any,
  onSwitch: () => void,
): void {
  if (state.schemas.length <= 1) {
    blessedMessage(screen, 'Only one schema available.').catch(() => {})
    return
  }

  const items = state.schemas.map((s) =>
    s === state.currentSchema ? `● ${s} (current)` : `  ${s}`,
  )

  const list = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '40%',
    height: Math.min(items.length + 4, 20),
    label: ' Switch Schema — Enter:select · Esc:cancel ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { fg: 'black', bg: 'cyan' },
      item: { fg: 'white' },
    },
    keys: true,
    vi: true,
    mouse: true,
    items,
  } as any)

  list.focus()

  list.on('select', (_item: any, idx: number) => {
    const schema = state.schemas[idx]
    screen.remove(list)
    if (schema && schema !== state.currentSchema) {
      state.currentSchema = schema
      loadSchemaTree(state, tree).then(onSwitch).catch(() => {})
    } else {
      onSwitch()
    }
  })

  list.key(['escape', 'q'], () => {
    screen.remove(list)
    onSwitch()
    screen.render()
  })

  screen.render()
}

// ─── Help modal ───────────────────────────────────────────────────────────────

function showHelpModal(
  screen: blessed.Widgets.Screen,
  restoreFocus: () => void,
): void {
  const help = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '62%',
    height: '82%',
    label: ' Help — q/Esc: close ',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    content: [
      '',
      ' {bold}{cyan-fg}Global Shortcuts{/}',
      '',
      ' {cyan-fg}Tab{/}          Cycle focus: Schema Tree → SQL Editor → Results',
      ' {cyan-fg}F1{/}           Show this help',
      ' {cyan-fg}F2{/}           Show connection info',
      ' {cyan-fg}F3{/}           Refresh schema tree',
      ' {cyan-fg}F4{/}           Switch schema',
      ' {cyan-fg}F5{/}           Execute SQL in editor',
      ' {cyan-fg}F7{/}           Browse query history',
      ' {cyan-fg}F9{/}           Diagnostics dashboard',
      ' {cyan-fg}F10{/}          Exit',
      '',
      ' {bold}{cyan-fg}SQL Editor (when focused){/}',
      '',
      ' {cyan-fg}Ctrl+L{/}       Clear editor',
      ' {cyan-fg}Ctrl+S{/}       Save query as snippet',
      ' {cyan-fg}F5{/}           Execute SQL',
      '',
      ' {bold}{cyan-fg}Schema Tree (when focused){/}',
      '',
      ' {cyan-fg}Enter{/}        Load table preview (SELECT * LIMIT 100)',
      ' {cyan-fg}↑ / ↓{/}        Navigate entries',
      ' {cyan-fg}Space{/}        Expand / collapse node',
      '',
      ' {bold}{cyan-fg}Results Panel (when focused){/}',
      '',
      ' {cyan-fg}↑ / ↓{/}        Scroll rows',
      ' {cyan-fg}j / k{/}         Vim-style scroll',
      ' {cyan-fg}g / G{/}         Jump to top / bottom',
      '',
      ' {bold}{cyan-fg}Query Execution{/}',
      '',
      ' Queries are sent as-is from the editor to the database.',
      ' Results appear in the bottom panel.',
      ' DDL statements (CREATE/DROP/ALTER) auto-refresh the schema tree.',
      '',
    ].join('\n'),
  } as any)

  help.focus()
  help.key(['q', 'escape'], () => {
    screen.remove(help)
    restoreFocus()
    screen.render()
  })
  screen.render()
}

// ─── Info modal ───────────────────────────────────────────────────────────────

async function showInfoModal(
  screen: blessed.Widgets.Screen,
  state: IDEState,
  restoreFocus: () => void,
): Promise<void> {
  let info: Record<string, any> = {}
  try {
    info = await state.adapter.getServerInfo()
  } catch {
    // ignore
  }

  const infoLines = [
    '',
    ' {bold}{cyan-fg}Connection{/}',
    '',
    ` {cyan-fg}Name:{/}        ${state.conn.name}`,
    ` {cyan-fg}Type:{/}        ${state.conn.type}`,
    ` {cyan-fg}Database:{/}    ${state.adapter.getCurrentDatabase()}`,
    ` {cyan-fg}Schema:{/}      ${state.currentSchema}`,
    ` {cyan-fg}Tables:{/}      ${state.tables.length}`,
    '',
    ' {bold}{cyan-fg}Server Info{/}',
    '',
    ...Object.entries(info).map(
      ([k, v]) =>
        ` {cyan-fg}${k}:{/}${' '.repeat(Math.max(1, 13 - k.length))}${v}`,
    ),
  ]

  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '52%',
    height: '62%',
    label: ' Connection Info — q/Esc: close ',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    content: infoLines.join('\n'),
  } as any)

  box.focus()
  box.key(['q', 'escape'], () => {
    screen.remove(box)
    restoreFocus()
    screen.render()
  })
  screen.render()
}

// ─── History modal ────────────────────────────────────────────────────────────

function showHistoryModal(
  screen: blessed.Widgets.Screen,
  state: IDEState,
  editor: blessed.Widgets.TextareaElement,
  onLoad: () => void,
): void {
  const history = getHistory(state.conn.id).slice(0, 100)
  if (history.length === 0) {
    blessedMessage(screen, 'No query history yet.').then(onLoad).catch(() => {})
    return
  }

  const items = history.map((h) => {
    const status = h.error ? '✕' : '✓'
    const short = h.sql.replace(/\s+/g, ' ').slice(0, 70)
    const dur = h.duration ? ` ${h.duration}ms` : ''
    return `${status} ${short}${dur}`
  })

  const list = blessed.list({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '78%',
    height: '62%',
    label: ' Query History — Enter: load into editor · q/Esc: close ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { fg: 'black', bg: 'cyan' },
      item: { fg: 'white' },
    },
    keys: true,
    vi: true,
    mouse: true,
    items,
  } as any)

  list.focus()

  list.on('select', (_item: any, idx: number) => {
    const h = history[idx]
    if (h) {
      editor.setValue(h.sql)
      screen.remove(list)
      onLoad()
    }
  })

  list.key(['q', 'escape'], () => {
    screen.remove(list)
    onLoad()
    screen.render()
  })

  screen.render()
}

// ─── Save snippet modal ───────────────────────────────────────────────────────

async function saveSnippetModal(
  screen: blessed.Widgets.Screen,
  sql: string,
  conn: Connection,
  restoreFocus: () => void,
): Promise<void> {
  const name = await blessedPrompt(screen, 'Snippet name', '')
  if (!name?.trim()) {
    restoreFocus()
    return
  }

  try {
    const { saveQuery } = await import('../config/store.js')
    saveQuery({
      name: name.trim(),
      sql,
      connectionType: conn.type,
    })
    await blessedMessage(screen, `Snippet "${name.trim()}" saved.`)
  } catch {
    await blessedMessage(screen, 'Failed to save snippet.')
  }

  restoreFocus()
}

// ─── Query executor ───────────────────────────────────────────────────────────

async function runQuery(
  state: IDEState,
  editor: blessed.Widgets.TextareaElement,
  resultsTable: any,
  statusBar: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
): Promise<void> {
  if (state.isRunning) return
  const sql = editor.getValue().trim()
  if (!sql) return

  state.isRunning = true
  resultsTable.setLabel(' Results — {yellow-fg}Running…{/} ')
  screen.render()

  const start = Date.now()
  let result: any
  try {
    result = await state.adapter.query(sql)
  } catch (err: any) {
    result = { rows: [], columns: [], error: err.message, rowCount: 0, affectedRows: 0 }
  }
  const elapsed = Date.now() - start
  state.isRunning = false
  state.lastQueryTime = elapsed

  addToHistory({
    connectionId: state.conn.id,
    sql,
    executedAt: new Date().toISOString(),
    duration: elapsed,
    rowCount: result.rowCount,
    error: result.error,
  })

  if (result.error) {
    resultsTable.setLabel(` Results — {red-fg}Error{/} `)
    resultsTable.setData({
      headers: ['Error'],
      data: [[result.error]],
    })
    state.lastResult = null
  } else if (result.rows && result.rows.length > 0) {
    resultsTable.setLabel(
      ` Results — {green-fg}${result.rows.length} rows{/}  {grey-fg}${elapsed}ms{/} `,
    )
    const data = (result.rows as Record<string, any>[]).map((row) =>
      (result.columns as string[]).map((c) => formatVal(row[c])),
    )
    resultsTable.setData({ headers: result.columns, data })
    state.lastResult = { columns: result.columns, rows: result.rows }
  } else {
    const affected = result.affectedRows ?? 0
    resultsTable.setLabel(
      ` Results — {green-fg}OK{/}  {grey-fg}${elapsed}ms{/} `,
    )
    resultsTable.setData({
      headers: ['Result'],
      data: [[`${affected} row(s) affected`]],
    })
    state.lastResult = null
    // DDL detected — caller (doRunQuery) will refresh the schema tree
    const upper = sql.trim().toUpperCase()
    if (/^(CREATE|DROP|ALTER|TRUNCATE)/.test(upper)) {
      statusBar.setContent(buildStatusContent(state))
      screen.render()
      return
    }
  }

  statusBar.setContent(buildStatusContent(state))
  screen.render()
}

// ─── Main IDE entry point ─────────────────────────────────────────────────────

export async function launchIDE(
  adapter: DbAdapter,
  conn: Connection,
  defaultSchema: string,
): Promise<void> {
  const screen = blessed.screen({
    smartCSR: true,
    title: `dbterm — ${conn.name}`,
    fullUnicode: true,
    dockBorders: true,
  })

  const state: IDEState = {
    adapter,
    conn,
    currentSchema: defaultSchema,
    schemas: [],
    tables: [],
    lastResult: null,
    lastQueryTime: null,
    isRunning: false,
  }

  // ── Menu bar ────────────────────────────────────────────────────────────────
  const menuBar = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: buildMenuContent(),
    tags: true,
    style: { fg: 'white', bg: 234 as any },
  } as any)

  // ── Schema tree (left panel) ────────────────────────────────────────────────
  const schemaTree: any = (contrib as any).tree({
    top: 1,
    left: 0,
    width: '28%',
    bottom: 4,
    label: ' Schema ',
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'cyan' },
      selected: { fg: 'black', bg: 'cyan' },
    },
    keys: true,
    vi: true,
    mouse: true,
  })

  // ── SQL editor (right/center panel, top portion) ────────────────────────────
  const sqlEditor = blessed.textarea({
    top: 1,
    left: '28%',
    width: '72%',
    bottom: 4,
    label: ' SQL Editor  ─  Ctrl+L: clear · Ctrl+S: save snippet ',
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'cyan' },
      focus: { border: { fg: 'yellow' } },
    },
    keys: true,
    mouse: true,
    inputOnFocus: true,
  } as any)

  // ── Results panel (bottom portion) ─────────────────────────────────────────
  const resultsTable: any = (contrib as any).table({
    bottom: 4,
    left: 0,
    width: '100%',
    height: '38%',
    label: ' Results ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      header: { fg: 'brightcyan', bold: true },
      cell: { fg: 'white' },
      focus: { border: { fg: 'yellow' } },
    },
    columnSpacing: 2,
    keys: true,
    vi: true,
    mouse: true,
    interactive: true,
    selectedFg: 'black',
    selectedBg: 'cyan',
  })

  resultsTable.setData({ headers: ['(run a query with F5)'], data: [] })

  // ── Status bar ──────────────────────────────────────────────────────────────
  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    border: { type: 'line' },
    style: { fg: 'white', bg: 'black', border: { fg: 234 as any } },
    content: buildStatusContent(state),
  } as any)

  screen.append(menuBar)
  screen.append(schemaTree)
  screen.append(sqlEditor)
  screen.append(resultsTable)
  screen.append(statusBar)

  // ── Focus management ────────────────────────────────────────────────────────
  const focusables: any[] = [schemaTree, sqlEditor, resultsTable]
  let focusIdx = 1 // Start with SQL editor

  function cycleFocus() {
    focusIdx = (focusIdx + 1) % focusables.length
    focusables[focusIdx].focus()
    screen.render()
  }

  function restoreFocus() {
    focusables[focusIdx].focus()
  }

  function updateStatus() {
    statusBar.setContent(buildStatusContent(state))
    screen.render()
  }

  // ── Schema loading ──────────────────────────────────────────────────────────
  async function doLoadSchema() {
    await loadSchemaTree(state, schemaTree)
    updateStatus()
  }

  // ── Query execution ─────────────────────────────────────────────────────────
  async function doRunQuery() {
    await runQuery(state, sqlEditor, resultsTable, statusBar, screen)
    // Refresh schema if DDL was executed
    const sql = sqlEditor.getValue().trim().toUpperCase()
    if (/^(CREATE|DROP|ALTER|TRUNCATE)/.test(sql)) {
      await doLoadSchema()
    }
  }

  // ── Global keybindings ──────────────────────────────────────────────────────
  screen.key('tab', () => cycleFocus())

  screen.key('f1', () => showHelpModal(screen, restoreFocus))

  screen.key('f2', () => {
    showInfoModal(screen, state, restoreFocus).catch(() => {})
  })

  screen.key('f3', () => {
    doLoadSchema().catch(() => {})
  })

  screen.key('f4', () => {
    showSchemaPicker(screen, state, schemaTree, () => {
      updateStatus()
      restoreFocus()
      screen.render()
    })
  })

  screen.key('f5', () => {
    doRunQuery().catch(() => {})
  })

  screen.key('f7', () => {
    showHistoryModal(screen, state, sqlEditor, () => {
      focusIdx = 1
      sqlEditor.focus()
      screen.render()
    })
  })

  screen.key('f9', async () => {
    await showDiagnosticsDashboard(adapter, state.currentSchema, conn.type)
    screen.render()
    restoreFocus()
  })

  screen.key('f10', () => screen.destroy())

  // ── SQL editor shortcuts ────────────────────────────────────────────────────
  sqlEditor.key('C-l', () => {
    sqlEditor.setValue('')
    screen.render()
  })

  sqlEditor.key('C-s', () => {
    const sql = sqlEditor.getValue().trim()
    if (sql) {
      saveSnippetModal(screen, sql, conn, () => {
        focusIdx = 1
        sqlEditor.focus()
        screen.render()
      }).catch(() => {})
    }
  })

  // ── Schema tree: Enter to preview table ─────────────────────────────────────
  schemaTree.on('select', (node: any) => {
    if (!node || !node.name) return
    const rawName = node.name as string
    // Strip icon prefix ("◈ " or "⬡ ") and row count suffix (" [42]")
    const name = rawName
      .replace(/^[⬡◈▸\s]+/, '')
      .replace(/\s*\[.*\]$/, '')
      .trim()
    if (
      name &&
      name !== state.currentSchema &&
      state.tables.some((t: TableInfo) => t.name === name)
    ) {
      const sql = `SELECT * FROM ${quoteIdent(name)} LIMIT 100`
      sqlEditor.setValue(sql)
      focusIdx = 1
      sqlEditor.focus()
      screen.render()
      doRunQuery().catch(() => {})
    }
  })

  // ── Initial load ─────────────────────────────────────────────────────────────
  await doLoadSchema()
  sqlEditor.focus()
  focusIdx = 1
  screen.render()

  return new Promise<void>((resolve) => {
    screen.on('destroy', () => resolve())
  })
}
