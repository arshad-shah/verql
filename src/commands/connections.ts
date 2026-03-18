// ─── Connection Manager (blessed UI) ─────────────────────────────────────────
// Replaces the inquirer-based connection manager with a full-screen blessed UI.
//
//  Layout:
//    ┌─ dbterm ─────────────────────────────────────────────────────┐
//    │                   (ASCII logo)                               │
//    ├─ Connections ────────────────────────────────────────────────┤
//    │  [PG] My Postgres  localhost:5432/mydb  (2024-01-01)        │
//    │  [MY] My MySQL     localhost:3306/app   (2024-01-02)        │
//    ├──────────────────────────────────────────────────────────────┤
//    │ Enter:connect  n:new  e:edit  d:delete  q:quit              │
//    └──────────────────────────────────────────────────────────────┘

import blessed from 'blessed'
import { randomBytes } from 'crypto'
import {
  getConnections, saveConnection, deleteConnection,
  type Connection, type DbType,
} from '../config/store.js'
import { createAdapter, DB_TYPE_LABELS, DB_TYPE_DEFAULTS } from '../db/adapter.js'
import { logo } from '../ui/theme.js'

const DB_TYPES: DbType[] = ['postgresql', 'mysql', 'sqlite', 'mssql', 'mongodb']

// ─── Small prompt/confirm helpers ────────────────────────────────────────────

function blessedPromptField(
  screen: blessed.Widgets.Screen,
  label: string,
  defaultValue = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    const prompt = blessed.prompt({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '54%',
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

function blessedConfirmDialog(
  screen: blessed.Widgets.Screen,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const question = blessed.question({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '54%',
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

function blessedSelectList(
  screen: blessed.Widgets.Screen,
  label: string,
  items: string[],
  selectedIndex = 0,
): Promise<number | null> {
  return new Promise((resolve) => {
    const list = blessed.list({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '54%',
      height: Math.min(items.length + 4, 18),
      label: ` ${label} `,
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
    ;(list as any).select(selectedIndex)
    list.focus()

    list.on('select', (_item: any, idx: number) => {
      screen.remove(list)
      resolve(idx)
    })

    list.key(['escape', 'q'], () => {
      screen.remove(list)
      resolve(null)
    })

    screen.render()
  })
}

function blessedShowMessage(
  screen: blessed.Widgets.Screen,
  text: string,
  delay = 2,
): Promise<void> {
  return new Promise((resolve) => {
    const msg = blessed.message({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '54%',
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

// ─── Connection form ──────────────────────────────────────────────────────────

async function createConnectionDialog(
  screen: blessed.Widgets.Screen,
  existing?: Connection,
): Promise<Connection | null> {
  // Step 1: Database type
  const typeItems = DB_TYPES.map((t) => `${t.toUpperCase().padEnd(12)} — ${DB_TYPE_LABELS[t]}`)
  const defaultTypeIdx = existing?.type ? DB_TYPES.indexOf(existing.type) : 0
  const typeIdx = await blessedSelectList(
    screen,
    existing ? 'Edit Connection — Select database type' : 'New Connection — Select database type',
    typeItems,
    defaultTypeIdx >= 0 ? defaultTypeIdx : 0,
  )
  if (typeIdx === null) return null

  const type = DB_TYPES[typeIdx]!
  const isSqlite = type === 'sqlite'
  const defaults = DB_TYPE_DEFAULTS[type]

  // Step 2: Connection name
  const name = await blessedPromptField(
    screen,
    'Connection name',
    existing?.name ?? `My ${DB_TYPE_LABELS[type]}`,
  )
  if (!name?.trim()) return null

  // Step 3a: SQLite — just need file path
  if (isSqlite) {
    const file = await blessedPromptField(
      screen,
      'SQLite file path',
      existing?.file ?? './database.db',
    )
    if (!file?.trim()) return null
    return {
      id: existing?.id ?? randomBytes(6).toString('hex'),
      type,
      name: name.trim(),
      database: file.trim(),
      file: file.trim(),
      lastUsed: existing?.lastUsed,
    }
  }

  // Step 3b: Network databases
  const host = await blessedPromptField(
    screen,
    'Host',
    existing?.host ?? (defaults as any).host ?? 'localhost',
  )
  if (host === null) return null

  const portStr = await blessedPromptField(
    screen,
    'Port',
    String(existing?.port ?? (defaults as any).port ?? 5432),
  )
  if (portStr === null) return null

  const database = await blessedPromptField(
    screen,
    'Database name',
    existing?.database ?? '',
  )
  if (database === null) return null

  const username = await blessedPromptField(
    screen,
    'Username',
    existing?.username ?? '',
  )
  if (username === null) return null

  const password = await blessedPromptField(screen, 'Password (leave blank to keep)', '')
  if (password === null) return null

  const sslItems = ['No', 'Yes']
  const sslIdx = await blessedSelectList(
    screen,
    'Use SSL?',
    sslItems,
    existing?.ssl ? 1 : 0,
  )
  const ssl = sslIdx === 1

  const timeoutStr = await blessedPromptField(
    screen,
    'Query timeout ms (0 = no limit)',
    String(existing?.queryTimeout ?? 30000),
  )

  return {
    id: existing?.id ?? randomBytes(6).toString('hex'),
    type,
    name: name.trim(),
    host: host.trim() || 'localhost',
    port: parseInt(portStr.trim(), 10) || (defaults as any).port || 5432,
    database: database.trim(),
    username: username.trim() || undefined,
    password: password.trim() || existing?.password || undefined,
    ssl,
    queryTimeout: parseInt(timeoutStr ?? '0', 10) || undefined,
    lastUsed: existing?.lastUsed,
  }
}

// ─── Test & save ──────────────────────────────────────────────────────────────

async function testAndSave(
  screen: blessed.Widgets.Screen,
  conn: Connection,
  connList: blessed.Widgets.ListElement,
): Promise<boolean> {
  // Show testing overlay
  const testingBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '54%',
    height: 5,
    label: ' Testing Connection ',
    border: { type: 'line' },
    tags: true,
    content: `\n  Connecting to {bold}${conn.name}{/}…`,
    style: { border: { fg: 'cyan' } },
  } as any)
  screen.render()

  try {
    const adapter = await createAdapter(conn)
    await adapter.connect()
    await adapter.disconnect()
    screen.remove(testingBox)
    saveConnection(conn)
    await blessedShowMessage(screen, `Connection to "${conn.name}" successful — saved.`)
    connList.focus()
    return true
  } catch (err: any) {
    screen.remove(testingBox)
    // Show the error as a message, then let user choose what to do
    await blessedShowMessage(screen, `Connection failed:\n  ${err.message}`, 3)
    const actionIdx = await blessedSelectList(screen, 'What would you like to do?', [
      'Save anyway',
      'Discard',
    ])
    if (actionIdx === 0) {
      saveConnection(conn)
      await blessedShowMessage(screen, `"${conn.name}" saved (without verification).`)
      connList.focus()
      return true
    }
    connList.focus()
    return false
  }
}

// ─── Connection label helper ──────────────────────────────────────────────────

function connLabel(c: Connection): string {
  const typeTag = `[${c.type.toUpperCase().slice(0, 2)}]`
  const location =
    c.type === 'sqlite'
      ? (c.file ?? c.database)
      : `${c.host ?? 'localhost'}:${c.port}/${c.database}`
  const lastUsed = c.lastUsed
    ? ` (${new Date(c.lastUsed).toLocaleDateString()})`
    : ''
  return `${typeTag.padEnd(5)} ${c.name.padEnd(24)} ${location}${lastUsed}`
}

// ─── Main connection manager ──────────────────────────────────────────────────

export async function manageConnections(): Promise<Connection | null> {
  return new Promise((resolve) => {
    let selectedConn: Connection | null = null

    const screen = blessed.screen({
      smartCSR: true,
      title: 'dbterm — Connections',
      fullUnicode: true,
    })

    // ── Logo/header ─────────────────────────────────────────────────────────
    const logoBox = blessed.box({
      top: 0,
      left: 'center',
      width: '100%',
      height: 8,
      tags: false,
      content: logo(),
      style: { fg: 'white' },
    } as any)

    // ── Connections list ─────────────────────────────────────────────────────
    const connList = blessed.list({
      top: 8,
      left: 0,
      width: '100%',
      bottom: 3,
      label: ' Connections ',
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan' },
        item: { fg: 'white' },
      },
      keys: true,
      vi: true,
      mouse: true,
    } as any)

    // ── Help bar ─────────────────────────────────────────────────────────────
    const helpBar = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      border: { type: 'line' },
      tags: true,
      style: { border: { fg: 234 as any }, fg: 'grey' },
      content:
        '  {bold}{cyan-fg}Enter{/} connect' +
        '   {bold}{cyan-fg}n{/} new' +
        '   {bold}{cyan-fg}e{/} edit' +
        '   {bold}{cyan-fg}d{/} delete' +
        '   {bold}{cyan-fg}q{/} quit',
    } as any)

    // ── Helpers ──────────────────────────────────────────────────────────────

    function getSorted(): Connection[] {
      return [...getConnections()].sort(
        (a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''),
      )
    }

    function refreshList() {
      const sorted = getSorted()
      if (sorted.length === 0) {
        connList.setItems(['  (no saved connections — press n to add one)'])
      } else {
        connList.setItems(sorted.map(connLabel))
      }
      screen.render()
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    connList.on('select', (_item: any, idx: number) => {
      const sorted = getSorted()
      if (sorted.length === 0) return
      const conn = sorted[idx]
      if (!conn) return
      selectedConn = conn
      screen.destroy()
    })

    connList.key('n', async () => {
      const conn = await createConnectionDialog(screen)
      if (conn) {
        await testAndSave(screen, conn, connList)
        refreshList()
      }
      connList.focus()
      screen.render()
    })

    connList.key('e', async () => {
      const sorted = getSorted()
      if (sorted.length === 0) return
      const idx = (connList as any).selected ?? 0
      const existing = sorted[idx]
      if (!existing) return
      const updated = await createConnectionDialog(screen, existing)
      if (updated) {
        await testAndSave(screen, updated, connList)
        refreshList()
      }
      connList.focus()
      screen.render()
    })

    connList.key('d', async () => {
      const sorted = getSorted()
      if (sorted.length === 0) return
      const idx = (connList as any).selected ?? 0
      const conn = sorted[idx]
      if (!conn) return
      const confirmed = await blessedConfirmDialog(screen, `Delete "${conn.name}"?`)
      if (confirmed) {
        deleteConnection(conn.id)
        refreshList()
      }
      connList.focus()
      screen.render()
    })

    connList.key(['q', 'escape'], () => {
      screen.destroy()
    })

    screen.key(['q', 'C-c'], () => {
      screen.destroy()
    })

    screen.append(logoBox)
    screen.append(connList)
    screen.append(helpBar)

    refreshList()
    connList.focus()
    screen.render()

    screen.on('destroy', () => resolve(selectedConn))
  })
}
