// ─── Session – launch the IDE ─────────────────────────────────────────────────
// Connects to the database, optionally lets the user pick a DB (via a blessed
// modal), then hands control to the full-screen IDE layout.

import blessed from 'blessed'
import { createSpinner } from 'nanospinner'
import type { Connection } from '../config/store.js'
import { updateLastUsed } from '../config/store.js'
import { createAdapter, type DbAdapter } from '../db/adapter.js'
import { theme } from '../ui/theme.js'
import { launchIDE } from '../ui/ide.js'

// ─── Database picker (blessed modal) ─────────────────────────────────────────

function pickDatabase(databases: string[], currentDb: string): Promise<string> {
  return new Promise((resolve) => {
    const screen = blessed.screen({
      smartCSR: true,
      title: 'dbterm — Select database',
      fullUnicode: true,
    })

    const items = databases.map((d) =>
      d === currentDb ? `● ${d} (current)` : `  ${d}`,
    )

    const list = blessed.list({
      top: 'center',
      left: 'center',
      width: '50%',
      height: Math.min(databases.length + 4, 20),
      label: ' Select Database — Enter: select · Esc: keep current ',
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

    const currentIdx = databases.indexOf(currentDb)
    ;(list as any).select(currentIdx >= 0 ? currentIdx : 0)

    screen.append(list)
    list.focus()
    screen.render()

    list.on('select', (_item: any, idx: number) => {
      const selected = databases[idx] ?? currentDb
      screen.destroy()
      resolve(selected)
    })

    list.key(['escape', 'q'], () => {
      screen.destroy()
      resolve(currentDb)
    })

    screen.on('destroy', () => resolve(currentDb))
  })
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function startSession(conn: Connection): Promise<void> {
  updateLastUsed(conn.id)

  const spinner = createSpinner(
    theme.primary(`Connecting to ${theme.value(conn.name)}…`),
  ).start()

  let adapter: DbAdapter

  try {
    adapter = await createAdapter(conn)
    await adapter.connect()
    spinner.success({ text: theme.success(`Connected to ${theme.value(conn.name)}`) })
  } catch (err: any) {
    spinner.error({ text: theme.error(`Failed: ${err.message}`) })
    process.exit(1)
  }

  // For multi-database engines (PostgreSQL, MySQL, MSSQL) let the user pick
  // a database via a blessed modal before opening the IDE.
  if (conn.type !== 'sqlite') {
    const dbs = await adapter.getDatabases().catch(() => [])
    if (dbs.length > 1) {
      const currentDb = adapter.getCurrentDatabase() ?? ''
      const selectedDb = await pickDatabase(dbs, currentDb)
      if (selectedDb !== currentDb) {
        const s2 = createSpinner(
          theme.primary(`Switching to ${selectedDb}…`),
        ).start()
        try {
          await adapter.useDatabase(selectedDb)
          s2.success({ text: theme.success(`Using ${selectedDb}`) })
        } catch (err: any) {
          s2.error({ text: theme.error(err.message) })
        }
      }
    }
  }

  const defaultSchema =
    conn.type === 'mysql'
      ? (adapter.getCurrentDatabase() ?? '')
      : conn.type === 'sqlite'
        ? 'main'
        : 'public'

  // Launch the full-screen IDE
  await launchIDE(adapter, conn, defaultSchema)

  await adapter.disconnect()
  console.log(theme.muted('\n  Disconnected. Bye! 👋\n'))
}
