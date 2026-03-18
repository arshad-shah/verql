import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import * as readline from 'readline'
import type { Connection } from '../config/store.js'
import { addToHistory, getHistory, updateLastUsed, clearHistory } from '../config/store.js'
import { createAdapter, type DbAdapter, type TableInfo } from '../db/adapter.js'
import { theme, box, divider, statusBar, renderTable, highlightSQL, SPINNER_FRAMES } from '../ui/theme.js'
import { quoteIdent } from '../utils/sql.js'
import { dataEditor } from './editor.js'
import { dumpImportMenu } from './dump.js'
import { savedQueriesMenu, promptSaveQuery } from './snippets.js'
import { transactionMenu, transactionBadge } from './transaction.js'
import { relationshipView } from './relations.js'
import { diagnosticsMenu, quickStats, quickSlow, quickLocks, quickSize, quickBloat } from './diagnostics.js'
import { showResultsFullscreen, showDiagnosticsDashboard, showSchemaTree } from '../ui/dashboard.js'

interface SessionState {
  adapter: DbAdapter
  conn: Connection
  currentSchema: string
  schemas: string[]
  tables: TableInfo[]
  selectedTable: string | null
  page: number
  lastResult: { columns: string[]; rows: Record<string, any>[] } | null
}

const W = () => process.stdout.columns ?? 120

// ─── Entry ────────────────────────────────────────────────────────────────────

export async function startSession(conn: Connection): Promise<void> {
  updateLastUsed(conn.id)
  const spinner = createSpinner(theme.primary(`Connecting to ${theme.value(conn.name)}…`)).start()
  let adapter: DbAdapter

  try {
    adapter = await createAdapter(conn)
    await adapter.connect()
    spinner.success({ text: theme.success(`Connected to ${theme.value(conn.name)}`) })
  } catch (err: any) {
    spinner.error({ text: theme.error(`Failed: ${err.message}`) })
    process.exit(1)
  }

  // Prompt user to pick a database (skip for SQLite — single file DB)
  if (conn.type !== 'sqlite') {
    const dbs = await adapter.getDatabases().catch(() => [])
    if (dbs.length > 1) {
      const currentDb = adapter.getCurrentDatabase()
      const { selectedDb } = await inquirer.prompt([{
        type: 'list', name: 'selectedDb',
        message: 'Select database:',
        choices: dbs.map((d) => ({
          name: d === currentDb ? theme.success(`● ${d} (connected)`) : `  ${d}`,
          value: d,
        })),
        default: currentDb,
        pageSize: 20,
      }])
      if (selectedDb !== currentDb) {
        const s2 = createSpinner(theme.primary(`Switching to ${selectedDb}...`)).start()
        try {
          await adapter.useDatabase(selectedDb)
          s2.success({ text: theme.success(`Using ${selectedDb}`) })
        } catch (err: any) {
          s2.error({ text: theme.error(err.message) })
        }
      }
    }
  }

  const defaultSchema = conn.type === 'mysql' ? (adapter.getCurrentDatabase() ?? '')
    : conn.type === 'sqlite' ? 'main'
    : 'public'

  const state: SessionState = {
    adapter, conn,
    currentSchema: defaultSchema,
    schemas: [],
    tables: [],
    selectedTable: null,
    page: 0,
    lastResult: null,
  }

  await refreshSchemas(state)
  await refreshTables(state)

  console.log()
  printWelcome(state)
  console.log()

  await mainMenu(state)

  await adapter.disconnect()
  console.log(theme.muted('\n  Disconnected. Bye! 👋\n'))
}

function printWelcome(state: SessionState): void {
  const txnBadge = transactionBadge(state.adapter)
  const tableCount = state.tables.length
  const viewCount = state.tables.filter((t) => t.type === 'view').length
  const tblCount = tableCount - viewCount
  const lines = [
    statusBar([
      { label: 'DB', value: state.conn.name, color: theme.accent },
      { label: 'Type', value: state.conn.type, color: theme.primary },
      { label: 'Database', value: state.adapter.getCurrentDatabase(), color: theme.success },
    ]) + (txnBadge ? '  ' + txnBadge : ''),
    statusBar([
      { label: 'Schema', value: state.currentSchema },
      { label: 'Tables', value: String(tblCount) },
      ...(viewCount > 0 ? [{ label: 'Views', value: String(viewCount) }] : []),
    ]),
    '',
    theme.muted('  Quick start: SQL Editor | .help for commands | .stats for diagnostics'),
  ]
  console.log(box('Connected', lines, W(), theme.success))
}

// ─── Main menu ────────────────────────────────────────────────────────────────

async function mainMenu(state: SessionState): Promise<void> {
  while (true) {
    const txn = state.adapter.isInTransaction()
    const txnLabel = txn ? theme.warn(' ⚡ TXN') : ''

    console.log()
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: theme.title('What would you like to do?') + txnLabel,
      pageSize: 30,
      loop: false,
      choices: [
        new inquirer.Separator(theme.muted('─── Query ─────────────────────────────────────')),
        { name: `${theme.accent('▶')}  ${theme.value('SQL Editor')}          Write & run SQL`, value: 'sql' },
        { name: `${theme.primary('★')}  ${theme.value('Saved Queries')}       Manage & run saved snippets`, value: 'saved' },
        { name: `${theme.primary('⟳')}  ${theme.value('Query History')}       Rerun past queries`, value: 'history' },
        new inquirer.Separator(theme.muted('─── Schema ────────────────────────────────────')),
        { name: `${theme.primary('◉')}  ${theme.value('Browse Tables')}       List & inspect tables`, value: 'tables' },
        { name: `${theme.primary('◈')}  ${theme.value('Table Data')}          Preview table contents`, value: 'data' },
        { name: `${theme.primary('◇')}  ${theme.value('Table Structure')}     Columns, indexes, FKs`, value: 'structure' },
        { name: `${theme.primary('❮❯')}  ${theme.value('View DDL')}            Show CREATE TABLE statement`, value: 'ddl' },
        { name: `${theme.primary('⚿')}  ${theme.value('Relationships')}       ER diagram, FK map, row explorer`, value: 'relations' },
        new inquirer.Separator(theme.muted('─── Edit Data ─────────────────────────────────')),
        { name: `${theme.warn('✎')}  ${theme.value('Data Editor')}         Insert / Update / Delete rows`, value: 'edit' },
        { name: `${theme.warn('⚡')}  ${theme.value('Transaction')}         BEGIN / COMMIT / ROLLBACK`, value: 'txn' },
        new inquirer.Separator(theme.muted('─── Dump & Import ─────────────────────────────')),
        { name: `${theme.primary('⬇')}  ${theme.value('Dump & Import')}       SQL/CSV/JSON export, CSV import`, value: 'dump' },
        new inquirer.Separator(theme.muted('─── Database ──────────────────────────────────')),
        { name: `${theme.primary('⬡')}  ${theme.value('Switch Schema')}       Change active schema`, value: 'switchschema' },
        { name: `${theme.primary('⬢')}  ${theme.value('Switch Database')}     Change active database`, value: 'switchdb' },
        { name: `${theme.primary('ℹ')}  ${theme.value('Server Info')}         Version & connection details`, value: 'info' },
        new inquirer.Separator(theme.muted('─── Performance ───────────────────────────────')),
        { name: `${theme.accent('◈')}  ${theme.value('Diagnostics')}         Bloat, indexes, locks, cache, slow queries`, value: 'diagnostics' },
        new inquirer.Separator(theme.muted('─── Tools ─────────────────────────────────────')),
        { name: `${theme.warn('⎗')}  ${theme.value('Export Results')}      Last query → CSV or JSON`, value: 'export' },
        { name: `${theme.warn('✕')}  ${theme.value('Clear History')}       Clear query history`, value: 'clearhistory' },
        new inquirer.Separator(theme.muted('───────────────────────────────────────────────')),
        { name: `${theme.muted('←')}  ${theme.muted('Disconnect')}`, value: 'disconnect' },
      ],
    }])

    if (action === 'disconnect') {
      if (state.adapter.isInTransaction()) {
        const { rollItBack } = await inquirer.prompt([{
          type: 'confirm', name: 'rollItBack',
          message: theme.warn('You have an open transaction. Rollback before disconnecting?'),
          default: true,
        }])
        if (rollItBack) await state.adapter.rollbackTransaction().catch(() => {})
      }
      break
    }

    switch (action) {
      case 'sql':          await sqlEditor(state); break
      case 'saved':        await savedQueriesMenu(state.adapter, state.conn.type, (sql) => executeSQL(sql, state)); break
      case 'history':      await queryHistoryMenu(state); break
      case 'tables':       await browseTablesMenu(state); break
      case 'data':         await previewTableData(state); break
      case 'structure':    await tableStructureMenu(state); break
      case 'ddl':          await viewDDL(state); break
      case 'relations':    await relationshipView(state.adapter, state.currentSchema, state.conn.type); break
      case 'edit':         await dataEditorMenu(state); break
      case 'txn':          await transactionMenu(state.adapter); break
      case 'dump':         await dumpImportMenu(state.adapter, state.conn, state.currentSchema); break
      case 'switchschema': await switchSchema(state); break
      case 'switchdb':     await switchDatabase(state); break
      case 'info':         await serverInfo(state); break
      case 'diagnostics':  await showDiagDashboardOrMenu(state); break
      case 'export':       await exportResults(state); break
      case 'clearhistory': await clearHistoryCmd(state); break
    }
  }
}

// ─── SQL Editor ───────────────────────────────────────────────────────────────

const DOT_COMMANDS = [
  '.exit', '.quit', '.clear', '.tables', '.schemas', '.history',
  '.begin', '.commit', '.rollback', '.explain', '.save',
  '.desc', '.run', '.buffer', '.help',
  '.stats', '.slow', '.locks', '.size', '.bloat',
]

const SQL_KW_COMPLETIONS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'JOIN', 'LEFT', 'RIGHT',
  'INNER', 'ON', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AS', 'BETWEEN', 'EXISTS',
  'UNION', 'ALL', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRUNCATE', 'CASCADE',
]

function buildCompleter(state: SessionState): readline.Completer {
  return (line: string): [string[], string] => {
    const trimmed = line.trimStart()
    // Dot-commands
    if (trimmed.startsWith('.')) {
      const hits = DOT_COMMANDS.filter((c) => c.startsWith(trimmed))
      return [hits.length ? hits : DOT_COMMANDS, trimmed]
    }
    // Get the last word being typed
    const words = trimmed.split(/\s+/)
    const partial = (words[words.length - 1] ?? '').toUpperCase()
    if (!partial) return [[], '']
    // Table names
    const tableNames = state.tables.map((t) => t.name)
    // SQL keywords + table names
    const all = [...SQL_KW_COMPLETIONS, ...tableNames]
    const hits = all.filter((w) => w.toUpperCase().startsWith(partial))
    return [hits, words[words.length - 1] ?? '']
  }
}

function printEditorHelp(): void {
  const cmds = [
    ['.help',            'Show this help'],
    ['.exit / .quit',    'Leave SQL editor'],
    ['.clear',           'Clear the query buffer'],
    ['.buffer',          'Show current buffer with highlighting'],
    ['.tables',          'List tables in current schema'],
    ['.schemas',         'List available schemas'],
    ['.desc <table>',    'Show columns for a table'],
    ['.history',         'Show recent queries'],
    ['.run <n>',         'Re-run query #n from history'],
    ['.explain',         'Run EXPLAIN on the buffer'],
    ['.save',            'Save buffer as a snippet'],
    ['.begin',           'Start transaction'],
    ['.commit',          'Commit transaction'],
    ['.rollback',        'Rollback transaction'],
    ['', ''],
    [theme.muted('─── Diagnostics ─'), ''],
    ['.stats',           'Database overview & cache stats'],
    ['.size',            'Table sizes'],
    ['.bloat',           'Table bloat / dead tuples'],
    ['.slow',            'Active / slow queries'],
    ['.locks',           'Current locks (PG)'],
    ['', ''],
    [theme.muted('─── Other ──────'), ''],
    ['Ctrl+C',           'Clear buffer or exit'],
    ['Tab',              'Auto-complete tables/keywords'],
  ]
  console.log()
  for (const [cmd, desc] of cmds) {
    console.log(`  ${theme.accent(cmd.padEnd(20))} ${theme.muted(desc)}`)
  }
  console.log()
  console.log(theme.muted('  End a query with ; to execute. Multi-line supported.'))
  console.log()
}

async function sqlEditor(state: SessionState): Promise<void> {
  console.log()
  console.log(divider('SQL Editor', W()))
  console.log(theme.muted('  Type .help for commands, Tab for completion, ; to execute'))
  if (state.adapter.isInTransaction()) {
    console.log(theme.warn('  ⚡ Transaction active — queries are not committed until you .commit'))
  }
  console.log()

  const sqlHistory = getHistory(state.conn.id).slice(0, 100).map((h) => h.sql.replace(/\n/g, ' '))
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer: buildCompleter(state),
    history: sqlHistory,
    historySize: 100,
  })

  // Live syntax highlighting: override readline's output writer so user
  // input is colorized as they type. Prompt strings pass through unchanged.
  const rlAny = rl as any
  rlAny._writeToOutput = function (str: string) {
    if (!str) return
    const promptStr: string = rlAny._prompt ?? ''
    if (str === promptStr) {
      // Prompt — already colored, write as-is
      rlAny.output.write(str)
    } else {
      // User input — apply SQL highlighting
      rlAny.output.write(highlightSQL(str))
    }
  }

  let sqlBuffer = ''
  let lineNum = 1

  // Use rl.setPrompt + rl.prompt so readline tracks the prompt width
  // correctly — this is what makes left/right arrow keys work.
  const showPrompt = () => {
    const txnTag = state.adapter.isInTransaction() ? theme.warn('[TXN] ') : ''
    if (sqlBuffer) {
      lineNum++
      rl.setPrompt(theme.muted(`  ${String(lineNum).padStart(3)} `) + theme.accent('· '))
    } else {
      lineNum = 1
      rl.setPrompt(theme.muted('    1 ') + theme.primary('▶ ') + txnTag)
    }
    rl.prompt()
  }

  await new Promise<void>((resolve) => {
    showPrompt()

    rl.on('line', async (line) => {
      const trimmed = line.trim()

      if (trimmed === '.exit' || trimmed === '.quit') { rl.close(); resolve(); return }
      if (trimmed === '.help') { printEditorHelp(); showPrompt(); return }
      if (trimmed === '.clear') { sqlBuffer = ''; console.log(theme.muted('  Buffer cleared.')); showPrompt(); return }
      if (trimmed === '.tables') { printTableList(state); showPrompt(); return }
      if (trimmed === '.schemas') {
        console.log(theme.muted('\n  Schemas: ') + state.schemas.map((s) => s === state.currentSchema ? theme.accent(s) : s).join('  '))
        console.log()
        showPrompt(); return
      }
      if (trimmed === '.history') { printHistoryList(state); showPrompt(); return }
      if (trimmed === '.buffer') {
        if (sqlBuffer.trim()) {
          console.log()
          sqlBuffer.split('\n').forEach((l, i) => {
            console.log(theme.muted(`  ${String(i + 1).padStart(3)} `) + highlightSQL(l))
          })
          console.log()
        } else { console.log(theme.muted('  (buffer empty)')) }
        showPrompt(); return
      }

      // ── Diagnostic dot commands ──────────────────────────────────────────
      if (trimmed === '.stats') {
        rl.pause(); await quickStats(state.adapter, state.currentSchema, state.conn.type); rl.resume(); showPrompt(); return
      }
      if (trimmed === '.slow') {
        rl.pause(); await quickSlow(state.adapter, state.conn.type); rl.resume(); showPrompt(); return
      }
      if (trimmed === '.locks') {
        rl.pause(); await quickLocks(state.adapter, state.conn.type); rl.resume(); showPrompt(); return
      }
      if (trimmed === '.size') {
        rl.pause(); await quickSize(state.adapter, state.currentSchema, state.conn.type); rl.resume(); showPrompt(); return
      }
      if (trimmed === '.bloat') {
        rl.pause(); await quickBloat(state.adapter, state.currentSchema, state.conn.type); rl.resume(); showPrompt(); return
      }

      if (trimmed.toLowerCase().startsWith('.desc')) {
        const tableName = trimmed.slice(5).trim()
        if (!tableName) { console.log(theme.warn('  Usage: .desc <table>')); showPrompt(); return }
        rl.pause()
        await showQuickDesc(tableName, state)
        rl.resume(); showPrompt(); return
      }

      if (trimmed.toLowerCase().startsWith('.run')) {
        const n = parseInt(trimmed.slice(4).trim(), 10)
        const hist = getHistory(state.conn.id)
        if (isNaN(n) || n < 1 || n > hist.length) {
          console.log(theme.warn(`  Usage: .run <1-${hist.length}>`)); showPrompt(); return
        }
        const sql = hist[n - 1].sql
        console.log(theme.muted(`  Re-running: `) + theme.value(sql.replace(/\s+/g, ' ').slice(0, 60)))
        rl.pause()
        await executeSQL(sql, state)
        rl.resume(); showPrompt(); return
      }

      if (trimmed === '.begin') {
        rl.pause()
        try { await state.adapter.beginTransaction(); console.log(theme.warn('\n  ⚡ Transaction started.\n')) }
        catch (e: any) { console.log(theme.error(`\n  ${e.message}\n`)) }
        rl.resume(); showPrompt(); return
      }
      if (trimmed === '.commit') {
        rl.pause()
        try { await state.adapter.commitTransaction(); console.log(theme.success('\n  ✓ Committed.\n')) }
        catch (e: any) { console.log(theme.error(`\n  ${e.message}\n`)) }
        rl.resume(); showPrompt(); return
      }
      if (trimmed === '.rollback') {
        rl.pause()
        try { await state.adapter.rollbackTransaction(); console.log(theme.warn('\n  ↩ Rolled back.\n')) }
        catch (e: any) { console.log(theme.error(`\n  ${e.message}\n`)) }
        rl.resume(); showPrompt(); return
      }

      const isExplain = trimmed.toLowerCase().startsWith('.explain')
      const isSave = trimmed.toLowerCase() === '.save'

      if (isSave) {
        const sql = sqlBuffer.trim()
        if (sql) {
          rl.pause()
          await promptSaveQuery(sql, state.conn.type)
          rl.resume()
        } else { console.log(theme.warn('  Nothing in buffer to save.')) }
        showPrompt(); return
      }

      sqlBuffer += (sqlBuffer ? '\n' : '') + line

      const actualSQL = isExplain ? sqlBuffer.replace(/^\.explain\s*/i, '') : sqlBuffer
      const trimmedUpper = actualSQL.trim().toUpperCase()
      const shouldRun = trimmed.endsWith(';') || isExplain ||
        (/^(SHOW|DESCRIBE|PRAGMA)\b/.test(trimmedUpper) && !sqlBuffer.includes('\n'))

      if (shouldRun && actualSQL.trim()) {
        const cleanSQL = actualSQL.replace(/;\s*$/, '').trim()
        rl.pause()
        await executeSQL(cleanSQL, state, isExplain)
        sqlBuffer = ''
        rl.resume()
      }

      showPrompt()
    })

    rl.on('close', () => resolve())
    rl.on('SIGINT', () => {
      if (sqlBuffer) { sqlBuffer = ''; console.log(theme.muted('\n  Buffer cleared.')); showPrompt() }
      else { rl.close(); resolve() }
    })
  })
}

async function showQuickDesc(table: string, state: SessionState): Promise<void> {
  const columns = await state.adapter.getColumns(table, state.currentSchema).catch(() => [])
  if (columns.length === 0) { console.log(theme.warn(`\n  Table "${table}" not found or has no columns.\n`)); return }
  console.log()
  console.log(theme.muted(`  ${table}:`))
  for (const c of columns) {
    const pk = c.isPrimaryKey ? theme.accent(' PK') : ''
    const nullable = c.nullable ? theme.muted(' null') : ''
    console.log(`    ${theme.value(c.name.padEnd(24))} ${theme.type_(c.type)}${pk}${nullable}`)
  }
  console.log()
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function detectStatementType(sql: string): string {
  const upper = sql.trim().toUpperCase()
  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) return 'SELECT'
  if (upper.startsWith('INSERT')) return 'INSERT'
  if (upper.startsWith('UPDATE')) return 'UPDATE'
  if (upper.startsWith('DELETE')) return 'DELETE'
  if (upper.startsWith('CREATE')) return 'CREATE'
  if (upper.startsWith('DROP')) return 'DROP'
  if (upper.startsWith('ALTER')) return 'ALTER'
  if (upper.startsWith('TRUNCATE')) return 'TRUNCATE'
  return 'QUERY'
}

async function executeSQL(sql: string, state: SessionState, isExplain = false): Promise<void> {
  console.log()
  let frame = 0
  const stmtType = detectStatementType(sql)
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${theme.primary(SPINNER_FRAMES[frame++ % SPINNER_FRAMES.length])} ${theme.muted(`Running ${stmtType}...`)}`)
  }, 80)

  const start = Date.now()
  const result = isExplain ? await state.adapter.explain(sql) : await state.adapter.query(sql)
  const elapsed = Date.now() - start

  clearInterval(interval)
  process.stdout.write('\r' + ' '.repeat(60) + '\r')

  addToHistory({ connectionId: state.conn.id, sql, executedAt: new Date().toISOString(), duration: elapsed, rowCount: result.rowCount, error: result.error })

  if (result.error) {
    console.log(box('Error', [
      theme.error(result.error),
      '',
      theme.muted(`SQL: ${sql.replace(/\s+/g, ' ').slice(0, 80)}`),
      theme.muted(`Duration: ${formatDuration(elapsed)}`),
    ], W(), theme.error))
    return
  }

  if (result.rows.length > 0) {
    state.lastResult = { columns: result.columns, rows: result.rows }
    state.page = 0
    await paginatedResults(result.columns, result.rows, state)
    console.log(theme.muted(`  ${result.rows.length} row(s) returned in ${formatDuration(elapsed)}`))
  } else {
    const affected = result.affectedRows ?? 0
    let msg: string
    if (stmtType === 'INSERT') msg = theme.success(`✓ ${affected} row(s) inserted`)
    else if (stmtType === 'UPDATE') msg = theme.success(`✓ ${affected} row(s) updated`)
    else if (stmtType === 'DELETE') msg = theme.success(`✓ ${affected} row(s) deleted`)
    else if (stmtType === 'CREATE') msg = theme.success(`✓ Created successfully`)
    else if (stmtType === 'DROP') msg = theme.success(`✓ Dropped successfully`)
    else if (stmtType === 'ALTER') msg = theme.success(`✓ Altered successfully`)
    else if (stmtType === 'TRUNCATE') msg = theme.success(`✓ Truncated`)
    else if (result.affectedRows !== undefined) msg = theme.success(`✓ ${affected} row(s) affected`)
    else msg = theme.success('✓ OK')
    console.log(`  ${msg}  ${theme.muted(formatDuration(elapsed))}`)
    const upper = sql.trim().toUpperCase()
    if (/^(CREATE|DROP|ALTER|TRUNCATE)/.test(upper)) await refreshTables(state)
  }
}

async function paginatedResults(columns: string[], rows: Record<string, any>[], state: SessionState): Promise<void> {
  // Use blessed fullscreen viewer for large result sets — interactive scrolling
  if (rows.length > 5) {
    await showResultsFullscreen(columns, rows)
    return
  }
  // Small results: inline display
  console.log()
  const { output } = renderTable(columns, rows, { pageSize: 30 })
  console.log(output)
}

// ─── Query History ────────────────────────────────────────────────────────────

async function queryHistoryMenu(state: SessionState): Promise<void> {
  const history = getHistory(state.conn.id)
  if (history.length === 0) { console.log(theme.muted('\n  No query history yet.\n')); return }

  console.log()
  const choices = history.slice(0, 100).map((h) => {
    const short = h.sql.replace(/\s+/g, ' ').slice(0, 65)
    const status = h.error ? theme.error('✕') : theme.success('✓')
    const dur = h.duration ? theme.muted(` ${h.duration}ms`) : ''
    const ts = theme.muted(new Date(h.executedAt).toLocaleTimeString())
    return { name: `${status} ${theme.value(short)}${dur} ${ts}`, value: h.sql }
  })
  choices.push({ name: theme.muted('← Back'), value: '__back__' } as any)

  const { selected } = await inquirer.prompt([{
    type: 'list', name: 'selected',
    message: 'Query history — select to act on:',
    choices, pageSize: 25, loop: false,
  }])

  if (selected === '__back__') return

  console.log()
  selected.split('\n').forEach((l: string) => console.log('  ' + highlightSQL(l)))
  console.log()

  const { histAction } = await inquirer.prompt([{
    type: 'list', name: 'histAction',
    message: 'Action:',
    choices: [
      { name: '▶  Run', value: 'run' },
      { name: '★  Save as snippet', value: 'save' },
      { name: '←  Back', value: 'back' },
    ],
  }])
  if (histAction === 'run') await executeSQL(selected, state)
  if (histAction === 'save') await promptSaveQuery(selected, state.conn.type)
}

// ─── Browse Tables ────────────────────────────────────────────────────────────

async function browseTablesMenu(state: SessionState): Promise<void> {
  await refreshTables(state)
  if (state.tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return }

  // Use blessed tree browser — fullscreen, expandable, shows columns inline
  const selected = await showSchemaTree(state.adapter, state.currentSchema)
  if (!selected) return
  state.selectedTable = selected
  await tableActions(state)
}

async function tableActions(state: SessionState): Promise<void> {
  const table = state.selectedTable!
  while (true) {
    console.log()
    const { action } = await inquirer.prompt([{
      type: 'list', name: 'action',
      message: `${theme.value(table)} — action:`,
      choices: [
        { name: `${theme.primary('▶')}  Preview data`, value: 'preview' },
        { name: `${theme.primary('◇')}  Columns / Indexes / FKs`, value: 'structure' },
        { name: `${theme.primary('❮❯')}  View DDL`, value: 'ddl' },
        { name: `${theme.warn('✎')}  Edit data (Insert/Update/Delete)`, value: 'edit' },
        { name: `${theme.primary('⬇')}  Dump table`, value: 'dump' },
        { name: `${theme.warn('⊞')}  Count rows (exact)`, value: 'count' },
        { name: `${theme.accent('✎')}  Open in SQL editor`, value: 'sql' },
        new inquirer.Separator(),
        { name: theme.muted('← Back'), value: 'back' },
      ],
    }])

    if (action === 'back') return
    if (action === 'preview') await executeSQL(`SELECT * FROM ${quoteIdent(table)} LIMIT 100`, state)
    if (action === 'structure') { await showColumns(table, state); await showIndexes(table, state); await showForeignKeys(table, state) }
    if (action === 'ddl') await showTableDDL(table, state)
    if (action === 'edit') await dataEditor(state.adapter, table, state.currentSchema, state.conn.type)
    if (action === 'dump') await dumpImportMenu(state.adapter, state.conn, state.currentSchema)
    if (action === 'count') {
      const n = await state.adapter.getTableRowCount(table, state.currentSchema).catch(() => '?')
      console.log(box(`${table} row count`, [theme.value(String(n)) + theme.muted(' rows')], W(), theme.primary))
    }
    if (action === 'sql') await sqlEditor(state)
  }
}

// ─── Structure helpers ────────────────────────────────────────────────────────

async function showColumns(table: string, state: SessionState): Promise<void> {
  const spinner = createSpinner(theme.muted('Loading columns…')).start()
  const columns = await state.adapter.getColumns(table, state.currentSchema).catch(() => [])
  spinner.stop()
  const rows = columns.map((c) => ({
    'Column': c.isPrimaryKey ? theme.accent('⚿ ' + c.name) : c.name,
    'Type': theme.type_(c.type),
    'Nullable': c.nullable ? theme.muted('YES') : theme.success('NO'),
    'Default': c.defaultValue ?? theme.muted('—'),
    'PK': c.isPrimaryKey ? theme.accent('✓') : '',
  }))
  const { output } = renderTable(['Column', 'Type', 'Nullable', 'Default', 'PK'], rows, { pageSize: 50 })
  console.log()
  console.log(divider(`${table} — Columns (${columns.length})`, W()))
  console.log(output)
}

async function showIndexes(table: string, state: SessionState): Promise<void> {
  const indexes = await state.adapter.getIndexes(table, state.currentSchema).catch(() => [])
  if (indexes.length === 0) return
  const rows = indexes.map((i: typeof indexes[number]) => ({
    'Name': i.name, 'Columns': i.columns.join(', '),
    'Unique': i.unique ? theme.success('✓') : theme.muted('—'),
  }))
  const { output } = renderTable(['Name', 'Columns', 'Unique'], rows, { pageSize: 20 })
  console.log(divider(`${table} — Indexes (${indexes.length})`, W()))
  console.log(output)
}

async function showForeignKeys(table: string, state: SessionState): Promise<void> {
  const fks = await state.adapter.getForeignKeys(table, state.currentSchema).catch(() => [])
  if (fks.length === 0) return
  const rows = fks.map((f) => ({
    'Column': f.column_name ?? f.from,
    'References': `${f.foreign_table ?? f.table}.${f.foreign_column ?? f.to}`,
    'On Delete': f.delete_rule ?? theme.muted('—'),
    'On Update': f.update_rule ?? theme.muted('—'),
  }))
  const { output } = renderTable(['Column', 'References', 'On Delete', 'On Update'], rows, { pageSize: 20 })
  console.log(divider(`${table} — Foreign Keys (${fks.length})`, W()))
  console.log(output)
}

async function showTableDDL(table: string, state: SessionState): Promise<void> {
  const spinner = createSpinner(theme.muted('Fetching DDL…')).start()
  let ddl: string
  try { ddl = await state.adapter.getTableDDL(table, state.currentSchema) }
  catch (err: any) { spinner.error({ text: theme.error(err.message) }); return }
  spinner.stop()
  console.log()
  console.log(divider(`${table} — DDL`, W()))
  ddl.split('\n').forEach((l) => console.log('  ' + highlightSQL(l)))
  console.log()
}

// ─── View DDL (menu) ──────────────────────────────────────────────────────────

async function viewDDL(state: SessionState): Promise<void> {
  await refreshTables(state)
  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table',
    message: 'View DDL for:',
    choices: [
      ...state.tables.map((t) => ({ name: t.name, value: t.name })),
      new inquirer.Separator(),
      { name: theme.muted('← Back'), value: '__back__' },
    ],
    pageSize: 25,
  }])
  if (table !== '__back__') await showTableDDL(table, state)
}

// ─── Preview table data ───────────────────────────────────────────────────────

async function previewTableData(state: SessionState): Promise<void> {
  await refreshTables(state)
  if (state.tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return }
  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table', message: 'Select table:',
    choices: state.tables.map((t) => ({ name: t.name, value: t.name })), pageSize: 25,
  }])
  await executeSQL(`SELECT * FROM ${quoteIdent(table)} LIMIT 100`, state)
}

// ─── Table structure menu ─────────────────────────────────────────────────────

async function tableStructureMenu(state: SessionState): Promise<void> {
  await refreshTables(state)
  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table', message: 'Select table:',
    choices: state.tables.map((t) => ({ name: t.name, value: t.name })), pageSize: 25,
  }])
  await showColumns(table, state)
  await showIndexes(table, state)
  await showForeignKeys(table, state)
}

// ─── Data Editor menu ─────────────────────────────────────────────────────────

async function dataEditorMenu(state: SessionState): Promise<void> {
  await refreshTables(state)
  if (state.tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return }
  const editableTables = state.tables.filter((t) => t.type === 'table')
  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table', message: 'Edit data in:',
    choices: [
      ...editableTables.map((t) => ({ name: t.name, value: t.name })),
      new inquirer.Separator(),
      { name: theme.muted('← Back'), value: '__back__' },
    ],
    pageSize: 25,
  }])
  if (table !== '__back__') await dataEditor(state.adapter, table, state.currentSchema, state.conn.type)
}

// ─── Switch Schema ────────────────────────────────────────────────────────────

async function switchSchema(state: SessionState): Promise<void> {
  await refreshSchemas(state)
  if (state.schemas.length === 0) { console.log(theme.warn('\n  No schemas found.\n')); return }

  const { schema } = await inquirer.prompt([{
    type: 'list', name: 'schema', message: 'Switch to schema:',
    choices: state.schemas.map((s) => ({
      name: s === state.currentSchema ? theme.success(`● ${s} (current)`) : `  ${s}`,
      value: s,
    })),
    pageSize: 20,
  }])

  if (schema === state.currentSchema) return
  state.currentSchema = schema
  await refreshTables(state)
  console.log(theme.success(`\n  ✓ Switched to schema: ${schema}\n`))
}

// ─── Switch Database ──────────────────────────────────────────────────────────

async function switchDatabase(state: SessionState): Promise<void> {
  const spinner = createSpinner(theme.muted('Loading databases…')).start()
  const dbs = await state.adapter.getDatabases().catch(() => [])
  spinner.stop()

  if (dbs.length === 0) { console.log(theme.warn('\n  Could not list databases.\n')); return }

  const { db } = await inquirer.prompt([{
    type: 'list', name: 'db', message: 'Switch to database:',
    choices: dbs.map((d) => ({
      name: d === state.adapter.getCurrentDatabase() ? theme.success(`● ${d} (current)`) : `  ${d}`,
      value: d,
    })), pageSize: 20,
  }])

  if (db === state.adapter.getCurrentDatabase()) return

  const spinner2 = createSpinner(theme.primary(`Switching to ${db}…`)).start()
  try {
    await state.adapter.useDatabase(db)
    if (state.conn.type === 'mysql') state.currentSchema = db
    await refreshSchemas(state)
    await refreshTables(state)
    spinner2.success({ text: theme.success(`Switched to ${db}`) })
  } catch (err: any) {
    spinner2.error({ text: theme.error(err.message) })
  }
}

// ─── Server Info ──────────────────────────────────────────────────────────────

async function serverInfo(state: SessionState): Promise<void> {
  const spinner = createSpinner(theme.muted('Fetching server info…')).start()
  const info = await state.adapter.getServerInfo().catch(() => ({}))
  spinner.stop()
  const lines = [
    ...Object.entries(info).map(([k, v]) => `${theme.label(k.padEnd(14))} ${theme.value(String(v))}`),
    '',
    `${theme.label('Connection'.padEnd(14))} ${theme.value(state.conn.name)}`,
    `${theme.label('Type'.padEnd(14))} ${theme.value(state.conn.type)}`,
    `${theme.label('Database'.padEnd(14))} ${theme.value(state.adapter.getCurrentDatabase())}`,
    `${theme.label('Schema'.padEnd(14))} ${theme.value(state.currentSchema)}`,
    `${theme.label('Tables'.padEnd(14))} ${theme.value(String(state.tables.length))}`,
  ]
  console.log()
  console.log(box('Server Information', lines, W(), theme.primary))
}

// ─── Export Results ───────────────────────────────────────────────────────────

async function exportResults(state: SessionState): Promise<void> {
  if (!state.lastResult) { console.log(theme.warn('\n  No results to export. Run a query first.\n')); return }

  const { format } = await inquirer.prompt([{
    type: 'list', name: 'format', message: 'Export format:',
    choices: [
      { name: 'CSV', value: 'csv' },
      { name: 'JSON', value: 'json' },
      { name: 'SQL INSERT statements', value: 'sql' },
    ],
  }])

  const ts = Date.now()
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:',
    default: `export-${ts}.${format}`,
  }])

  const { columns, rows } = state.lastResult
  const { writeFile } = await import('fs/promises')

  if (format === 'csv') {
    const csv = [columns.join(','), ...rows.map((r) => columns.map((c) => {
      const v = String(r[c] ?? '')
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
    }).join(','))].join('\n')
    await writeFile(filename, csv, 'utf8')
  } else if (format === 'json') {
    await writeFile(filename, JSON.stringify(rows, null, 2), 'utf8')
  } else {
    const quotedCols = columns.map((c) => `"${c}"`).join(', ')
    const sqlLines = rows.map((r) => {
      const vals = columns.map((c) => {
        const v = r[c]
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'number') return String(v)
        return `'${String(v).replace(/'/g, "''")}'`
      }).join(', ')
      return `INSERT INTO "table" (${quotedCols}) VALUES (${vals});`
    })
    await writeFile(filename, sqlLines.join('\n'), 'utf8')
  }

  console.log(theme.success(`\n  ✓ Exported ${rows.length} rows → ${filename}\n`))
}

// ─── Clear History ────────────────────────────────────────────────────────────

async function clearHistoryCmd(state: SessionState): Promise<void> {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: theme.warn('Clear all query history for this connection?'), default: false,
  }])
  if (confirm) { clearHistory(state.conn.id); console.log(theme.success('\n  ✓ History cleared.\n')) }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function showDiagDashboardOrMenu(state: SessionState): Promise<void> {
  const { mode } = await inquirer.prompt([{
    type: 'list', name: 'mode',
    message: 'Diagnostics mode:',
    choices: [
      { name: `${theme.accent('◈')}  Dashboard — fullscreen visual overview`, value: 'dashboard' },
      { name: `${theme.primary('◇')}  Detailed — menu-driven diagnostics`, value: 'menu' },
      { name: theme.muted('← Back'), value: 'back' },
    ],
  }])
  if (mode === 'back') return
  if (mode === 'dashboard') await showDiagnosticsDashboard(state.adapter, state.currentSchema, state.conn.type)
  if (mode === 'menu') await diagnosticsMenu(state.adapter, state.currentSchema, state.conn.type)
}

async function refreshTables(state: SessionState): Promise<void> {
  try { state.tables = await state.adapter.getTables(state.currentSchema) }
  catch { state.tables = [] }
}

async function refreshSchemas(state: SessionState): Promise<void> {
  try { state.schemas = await state.adapter.getSchemas() }
  catch { state.schemas = [state.currentSchema] }
}

function printTableList(state: SessionState): void {
  console.log()
  state.tables.forEach((t) => {
    console.log(`  ${t.type === 'view' ? theme.accent('⬡') : theme.primary('◈')} ${theme.value(t.name)}`)
  })
  console.log()
}

function printHistoryList(state: SessionState): void {
  const h = getHistory(state.conn.id).slice(0, 10)
  console.log()
  h.forEach((q, i) => {
    console.log(`  ${theme.muted(String(i + 1).padStart(2))}  ${theme.value(q.sql.replace(/\s+/g, ' ').slice(0, 60))}`)
  })
  console.log()
}
