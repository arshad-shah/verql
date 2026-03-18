import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import { randomBytes } from 'crypto'
import {
  getConnections, saveConnection, deleteConnection,
  type Connection, type DbType
} from '../config/store.js'
import { createAdapter, DB_TYPE_LABELS, DB_TYPE_DEFAULTS } from '../db/adapter.js'
import { theme, box, divider, badge, logo } from '../ui/theme.js'

const DB_TYPES: DbType[] = ['postgresql', 'mysql', 'sqlite', 'mssql', 'mongodb']

const TYPE_COLORS: Record<DbType, any> = {
  postgresql: theme.pg,
  mysql: theme.mysql,
  sqlite: theme.sqlite,
  mssql: theme.mssql,
  mongodb: theme.mongo,
}

function connLabel(c: Connection): string {
  const typeLabel = TYPE_COLORS[c.type]?.(c.type.toUpperCase().slice(0, 2)) ?? c.type
  const host = c.type === 'sqlite' ? (c.file ?? c.database) : `${c.host ?? 'localhost'}:${c.port}`
  const lastUsed = c.lastUsed
    ? theme.muted(' · ' + new Date(c.lastUsed).toLocaleDateString())
    : ''
  return `[${typeLabel}] ${theme.value(c.name)}  ${theme.muted(host)}${lastUsed}`
}

export async function manageConnections(): Promise<Connection | null> {
  console.clear()
  console.log(logo())
  console.log()

  const connections = getConnections()

  const choices: any[] = []

  if (connections.length > 0) {
    const recent = [...connections].sort((a, b) =>
      (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '')
    )
    choices.push(new inquirer.Separator(theme.muted('─── Recent Connections ───────────────────────')))
    for (const c of recent) {
      choices.push({ name: connLabel(c), value: { action: 'connect', conn: c } })
    }
  }

  choices.push(new inquirer.Separator(theme.muted('─── Actions ──────────────────────────────────')))
  choices.push({ name: theme.accent('＋  New Connection'), value: { action: 'new' } })

  if (connections.length > 0) {
    choices.push({ name: theme.warn('✎   Edit Connection'), value: { action: 'edit' } })
    choices.push({ name: theme.error('✕   Delete Connection'), value: { action: 'delete' } })
  }

  choices.push({ name: theme.muted('    Exit'), value: { action: 'exit' } })

  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: theme.title('Select a connection or action:'),
    choices,
    pageSize: 20,
    loop: false,
  }])

  if (choice.action === 'exit') {
    console.log(theme.muted('\n  Goodbye! 👋\n'))
    process.exit(0)
  }

  if (choice.action === 'connect') {
    return choice.conn as Connection
  }

  if (choice.action === 'new') {
    const conn = await createConnectionDialog()
    if (conn) {
      const ok = await testAndSave(conn)
      if (ok) return conn
    }
    return manageConnections()
  }

  if (choice.action === 'edit') {
    const { toEdit } = await inquirer.prompt([{
      type: 'list',
      name: 'toEdit',
      message: 'Select connection to edit:',
      choices: connections.map(c => ({ name: connLabel(c), value: c })),
    }])
    const updated = await createConnectionDialog(toEdit)
    if (updated) {
      await testAndSave(updated)
    }
    return manageConnections()
  }

  if (choice.action === 'delete') {
    const { toDel } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'toDel',
      message: 'Select connections to delete:',
      choices: connections.map(c => ({ name: connLabel(c), value: c.id })),
    }])
    if (toDel.length > 0) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: theme.error(`Delete ${toDel.length} connection(s)?`),
        default: false,
      }])
      if (confirm) {
        for (const id of toDel) deleteConnection(id)
        console.log(theme.success(`\n  ✓ Deleted ${toDel.length} connection(s)\n`))
      }
    }
    return manageConnections()
  }

  return null
}

async function createConnectionDialog(existing?: Connection): Promise<Connection | null> {
  console.log('\n' + divider(existing ? 'Edit Connection' : 'New Connection', 60))
  console.log()

  const { type } = await inquirer.prompt([{
    type: 'list',
    name: 'type',
    message: 'Database type:',
    default: existing?.type ?? 'postgresql',
    choices: DB_TYPES.map(t => ({ name: DB_TYPE_LABELS[t], value: t })),
  }])

  const defaults = DB_TYPE_DEFAULTS[type as DbType]
  const isSqlite = type === 'sqlite'

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Connection name:',
      default: existing?.name ?? `My ${type} DB`,
      validate: (v: string) => v.trim().length > 0 || 'Name is required',
    },
    {
      type: 'input',
      name: 'group',
      message: 'Group (optional):',
      default: existing?.group ?? '',
    },
    ...(isSqlite ? [
      {
        type: 'input',
        name: 'file',
        message: 'SQLite file path:',
        default: existing?.file ?? './database.db',
        validate: (v: string) => v.trim().length > 0 || 'File path is required',
      },
    ] : [
      {
        type: 'input',
        name: 'host',
        message: 'Host:',
        default: existing?.host ?? defaults.host,
      },
      {
        type: 'number',
        name: 'port',
        message: 'Port:',
        default: existing?.port ?? defaults.port,
      },
      {
        type: 'input',
        name: 'database',
        message: 'Database name:',
        default: existing?.database ?? '',
        validate: (v: string) => v.trim().length > 0 || 'Database name is required',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username:',
        default: existing?.username ?? '',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        default: existing?.password ?? '',
      },
      {
        type: 'confirm',
        name: 'ssl',
        message: 'Use SSL?',
        default: existing?.ssl ?? false,
      },
      {
        type: 'number',
        name: 'queryTimeout',
        message: 'Query timeout (ms, 0=no limit):',
        default: existing?.queryTimeout ?? 30000,
      },
    ]),
  ])

  return {
    id: existing?.id ?? randomBytes(6).toString('hex'),
    type: type as DbType,
    name: answers.name.trim(),
    group: answers.group?.trim() || undefined,
    host: answers.host,
    port: answers.port,
    database: answers.database ?? (isSqlite ? answers.file : ''),
    username: answers.username,
    password: answers.password,
    ssl: answers.ssl,
    file: answers.file,
    queryTimeout: answers.queryTimeout || undefined,
    lastUsed: existing?.lastUsed,
  }
}

async function testAndSave(conn: Connection): Promise<boolean> {
  const spinner = createSpinner(theme.primary(`Testing connection to ${theme.value(conn.name)}…`)).start()

  try {
    const adapter = await createAdapter(conn)
    await adapter.connect()
    await adapter.disconnect()
    spinner.success({ text: theme.success(`Connected successfully!`) })
    saveConnection(conn)
    console.log(theme.muted(`  Connection "${conn.name}" saved.\n`))
    return true
  } catch (err: any) {
    spinner.error({ text: theme.error(`Connection failed: ${err.message}`) })
    const { retry } = await inquirer.prompt([{
      type: 'list',
      name: 'retry',
      message: 'What would you like to do?',
      choices: [
        { name: 'Save anyway', value: 'save' },
        { name: 'Edit connection', value: 'edit' },
        { name: 'Discard', value: 'discard' },
      ],
    }])
    if (retry === 'save') {
      saveConnection(conn)
      return true
    }
    if (retry === 'edit') {
      const updated = await createConnectionDialog(conn)
      if (updated) return testAndSave(updated)
    }
    return false
  }
}
