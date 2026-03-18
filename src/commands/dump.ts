import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import { writeFile, readFile, access, stat } from 'fs/promises'
import { createWriteStream } from 'fs'
import type { DbAdapter } from '../db/adapter.js'
import type { Connection, DbType } from '../config/store.js'
import { theme, box, divider } from '../ui/theme.js'
import { quoteIdent, quoteTable, quoteLiteral, buildPlaceholders, splitSQLStatements } from '../utils/sql.js'

const W = () => process.stdout.columns ?? 120

// ─── Main dump/import menu ────────────────────────────────────────────────────

export async function dumpImportMenu(adapter: DbAdapter, conn: Connection, schema: string): Promise<void> {
  const dbType = conn.type
  console.log()
  console.log(divider('Dump & Import', W()))

  while (true) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Select operation:',
      choices: [
        new inquirer.Separator(theme.muted('─── Export / Dump ──────────────────────────')),
        { name: `${theme.primary('⬇')}  Dump table → SQL INSERT statements`, value: 'dump_sql' },
        { name: `${theme.primary('⬇')}  Dump table → CSV file`, value: 'dump_csv' },
        { name: `${theme.primary('⬇')}  Dump table → JSON file`, value: 'dump_json' },
        { name: `${theme.primary('⬇')}  Export query result → CSV`, value: 'export_csv' },
        { name: `${theme.primary('⬇')}  Export query result → JSON`, value: 'export_json' },
        { name: `${theme.primary('◇')}  Dump schema DDL (CREATE TABLE statements)`, value: 'dump_schema' },
        new inquirer.Separator(theme.muted('─── Import ─────────────────────────────────')),
        { name: `${theme.accent('⬆')}  Import CSV → table`, value: 'import_csv' },
        { name: `${theme.accent('⬆')}  Execute SQL file`, value: 'import_sql' },
        new inquirer.Separator(),
        { name: theme.muted('← Back'), value: 'back' },
      ],
      pageSize: 20,
    }])

    if (action === 'back') return
    if (action === 'dump_sql')    await dumpTableSQL(adapter, schema, dbType)
    if (action === 'dump_csv')    await dumpTableCSV(adapter, schema, dbType)
    if (action === 'dump_json')   await dumpTableJSON(adapter, schema, dbType)
    if (action === 'export_csv')  await exportQueryCSV(adapter)
    if (action === 'export_json') await exportQueryJSON(adapter)
    if (action === 'dump_schema') await dumpSchemaDDL(adapter, schema)
    if (action === 'import_csv')  await importCSV(adapter, schema, dbType)
    if (action === 'import_sql')  await importSQLFile(adapter)
  }
}

// ─── Dump table to SQL INSERT statements ─────────────────────────────────────

async function dumpTableSQL(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  const tables = await adapter.getTables(schema)
  const { table } = await pickTable(tables)
  if (!table) return

  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename',
    message: 'Output file:',
    default: `${table}-dump-${ts}.sql`,
  }])

  const { batchSize } = await inquirer.prompt([{
    type: 'list', name: 'batchSize',
    message: 'INSERT batch size:',
    choices: ['1', '100', '500', '1000'].map((v) => ({ name: v, value: Number(v) })),
    default: 500,
  }])

  const spinner = createSpinner(theme.primary(`Dumping ${table}...`)).start()
  try {
    const columns = await adapter.getColumns(table, schema)
    const colNames = columns.map((c) => c.name)
    const tblRef = quoteTable(table, schema, dbType)

    const rowCount = await adapter.getTableRowCount(table, schema)
    const PAGE_SIZE = 1000

    const header = [
      `-- dbterm dump`,
      `-- Table: ${schema ? `${schema}.` : ''}${table}`,
      `-- Date: ${new Date().toISOString()}`,
      `-- Rows: ${rowCount}`,
      '',
    ].join('\n')

    const quotedCols = colNames.map(quoteIdent).join(', ')
    const ws = createWriteStream(filename, 'utf8')
    ws.write(header)

    let written = 0

    if (rowCount <= 10000) {
      const result = await adapter.query(`SELECT * FROM ${tblRef}`)
      if (result.error) throw new Error(result.error)
      for (let i = 0; i < result.rows.length; i += batchSize) {
        const batch = result.rows.slice(i, i + batchSize)
        const valRows = batch.map((row) =>
          '(' + colNames.map((c) => quoteLiteral(row[c])).join(', ') + ')'
        )
        ws.write(`INSERT INTO ${tblRef} (${quotedCols}) VALUES\n`)
        ws.write(valRows.join(',\n') + ';\n\n')
      }
      written = result.rows.length
    } else {
      let offset = 0
      while (offset < rowCount) {
        const result = await adapter.query(
          `SELECT * FROM ${tblRef} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
        )
        if (result.error) throw new Error(result.error)
        if (result.rows.length === 0) break

        for (let i = 0; i < result.rows.length; i += batchSize) {
          const batch = result.rows.slice(i, i + batchSize)
          const valRows = batch.map((row) =>
            '(' + colNames.map((c) => quoteLiteral(row[c])).join(', ') + ')'
          )
          ws.write(`INSERT INTO ${tblRef} (${quotedCols}) VALUES\n`)
          ws.write(valRows.join(',\n') + ';\n\n')
        }
        written += result.rows.length
        offset += PAGE_SIZE

        const pct = Math.round((written / rowCount) * 100)
        spinner.update({ text: theme.primary(`Dumping ${table}... ${pct}% (${written}/${rowCount} rows)`) })
      }
    }

    await new Promise<void>((resolve, reject) => { ws.end(() => resolve()); ws.on('error', reject) })
    const fileStats = await stat(filename)
    const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2)
    spinner.success({ text: theme.success(`Dumped ${written} rows -> ${filename} (${sizeMB} MB)`) })
  } catch (err: any) {
    spinner.error({ text: theme.error(err.message) })
  }
}

// ─── Dump table to CSV ────────────────────────────────────────────────────────

async function dumpTableCSV(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  const tables = await adapter.getTables(schema)
  const { table } = await pickTable(tables)
  if (!table) return

  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:',
    default: `${table}-${ts}.csv`,
  }])

  const spinner = createSpinner(theme.primary(`Exporting ${table} to CSV...`)).start()
  try {
    const result = await adapter.query(`SELECT * FROM ${quoteTable(table, schema, dbType)}`)
    if (result.error) throw new Error(result.error)
    await writeFile(filename, toCSV(result.columns, result.rows), 'utf8')
    spinner.success({ text: theme.success(`Exported ${result.rows.length} rows -> ${filename}`) })
  } catch (err: any) {
    spinner.error({ text: theme.error(err.message) })
  }
}

// ─── Dump table to JSON ───────────────────────────────────────────────────────

async function dumpTableJSON(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  const tables = await adapter.getTables(schema)
  const { table } = await pickTable(tables)
  if (!table) return

  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:',
    default: `${table}-${ts}.json`,
  }])

  const { pretty } = await inquirer.prompt([{
    type: 'confirm', name: 'pretty', message: 'Pretty-print JSON?', default: true,
  }])

  const spinner = createSpinner(theme.primary(`Exporting ${table} to JSON...`)).start()
  try {
    const result = await adapter.query(`SELECT * FROM ${quoteTable(table, schema, dbType)}`)
    if (result.error) throw new Error(result.error)
    const json = pretty ? JSON.stringify(result.rows, null, 2) : JSON.stringify(result.rows)
    await writeFile(filename, json, 'utf8')
    spinner.success({ text: theme.success(`Exported ${result.rows.length} rows -> ${filename}`) })
  } catch (err: any) {
    spinner.error({ text: theme.error(err.message) })
  }
}

// ─── Export arbitrary query ───────────────────────────────────────────────────

async function exportQueryCSV(adapter: DbAdapter): Promise<void> {
  const { sql } = await inquirer.prompt([{
    type: 'input', name: 'sql',
    message: 'SQL query to export:',
    validate: (v: string) => v.trim().length > 0 || 'Query required',
  }])
  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:', default: `query-export-${ts}.csv`,
  }])

  const spinner = createSpinner(theme.primary('Running query...')).start()
  const result = await adapter.query(sql)
  if (result.error) { spinner.error({ text: theme.error(result.error) }); return }
  await writeFile(filename, toCSV(result.columns, result.rows), 'utf8')
  spinner.success({ text: theme.success(`Exported ${result.rows.length} rows -> ${filename}`) })
}

async function exportQueryJSON(adapter: DbAdapter): Promise<void> {
  const { sql } = await inquirer.prompt([{
    type: 'input', name: 'sql',
    message: 'SQL query to export:',
    validate: (v: string) => v.trim().length > 0 || 'Query required',
  }])
  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:', default: `query-export-${ts}.json`,
  }])

  const spinner = createSpinner(theme.primary('Running query...')).start()
  const result = await adapter.query(sql)
  if (result.error) { spinner.error({ text: theme.error(result.error) }); return }
  await writeFile(filename, JSON.stringify(result.rows, null, 2), 'utf8')
  spinner.success({ text: theme.success(`Exported ${result.rows.length} rows -> ${filename}`) })
}

// ─── Dump schema DDL ──────────────────────────────────────────────────────────

async function dumpSchemaDDL(adapter: DbAdapter, schema: string): Promise<void> {
  const tables = await adapter.getTables(schema)

  const { selected } = await inquirer.prompt([{
    type: 'checkbox', name: 'selected',
    message: 'Select tables to dump DDL for:',
    choices: [
      { name: theme.primary('(all tables)'), value: '__all__' },
      ...tables.filter((t) => t.type === 'table').map((t) => ({ name: t.name, value: t.name })),
    ],
    pageSize: 25,
  }])

  const targets = selected.includes('__all__')
    ? tables.filter((t) => t.type === 'table').map((t) => t.name)
    : selected

  if (targets.length === 0) { console.log(theme.muted('\n  Nothing selected.\n')); return }

  const ts = new Date().toISOString().slice(0, 10)
  const { filename } = await inquirer.prompt([{
    type: 'input', name: 'filename', message: 'Output file:',
    default: `schema-ddl-${ts}.sql`,
  }])

  const spinner = createSpinner(theme.primary(`Generating DDL for ${targets.length} table(s)...`)).start()
  const lines: string[] = [
    `-- dbterm schema dump`,
    `-- Schema: ${schema}`,
    `-- Date: ${new Date().toISOString()}`,
    `-- Tables: ${targets.join(', ')}`,
    '',
  ]

  for (const t of targets) {
    try {
      const ddl = await adapter.getTableDDL(t, schema)
      lines.push(`-- Table: ${t}`)
      lines.push(ddl)
      lines.push('')
    } catch (err: any) {
      lines.push(`-- ERROR dumping ${t}: ${err.message}`)
    }
  }

  await writeFile(filename, lines.join('\n'), 'utf8')
  spinner.success({ text: theme.success(`DDL for ${targets.length} table(s) -> ${filename}`) })
}

// ─── Import CSV ───────────────────────────────────────────────────────────────

async function importCSV(adapter: DbAdapter, schema: string, dbType: DbType): Promise<void> {
  const { filepath } = await inquirer.prompt([{
    type: 'input', name: 'filepath', message: 'CSV file path:',
    validate: async (v: string) => {
      try { await access(v); return true } catch { return `File not found: ${v}` }
    },
  }])

  const tables = await adapter.getTables(schema)
  const { table } = await pickTable(tables, 'Target table:')
  if (!table) return

  const { onConflict } = await inquirer.prompt([{
    type: 'list', name: 'onConflict',
    message: 'On duplicate/conflict:',
    choices: [
      { name: 'Fail (raise error)', value: 'fail' },
      { name: 'Skip row (INSERT OR IGNORE)', value: 'ignore' },
    ],
  }])

  const spinner = createSpinner(theme.primary(`Reading ${filepath}...`)).start()
  try {
    const content = await readFile(filepath, 'utf8')
    const rows = parseCSV(content)
    if (rows.length < 2) throw new Error('CSV has no data rows')

    const headers = rows[0]
    const dataRows = rows.slice(1)
    spinner.stop()

    console.log(theme.muted(`\n  Found ${dataRows.length} rows, ${headers.length} columns: ${headers.join(', ')}\n`))

    const { confirm } = await inquirer.prompt([{
      type: 'confirm', name: 'confirm',
      message: `Import ${dataRows.length} rows into ${table}?`, default: true,
    }])
    if (!confirm) return

    const spinner2 = createSpinner(theme.primary(`Importing ${dataRows.length} rows...`)).start()
    let inserted = 0
    let failed = 0
    const columns = await adapter.getColumns(table, schema)
    const tblRef = quoteTable(table, schema, dbType)

    for (const row of dataRows) {
      const obj: Record<string, any> = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? null })
      const cols = headers.filter((h) => columns.some((c) => c.name === h))
      const vals = cols.map((c) => obj[c])
      const phs = buildPlaceholders(cols.length, dbType)
      const quotedCols = cols.map(quoteIdent).join(', ')
      const sql = `INSERT INTO ${tblRef} (${quotedCols}) VALUES (${phs.join(', ')})`

      try {
        const res = await adapter.query(sql, vals)
        if (res.error) {
          if (onConflict === 'ignore') { failed++; continue }
          throw new Error(res.error)
        }
        inserted++
      } catch (err: any) {
        if (onConflict === 'ignore') { failed++; continue }
        spinner2.error({ text: theme.error(`Row ${inserted + failed + 1}: ${err.message}`) })
        return
      }
    }
    spinner2.success({ text: theme.success(`Imported ${inserted} rows` + (failed ? `, skipped ${failed}` : '')) })
  } catch (err: any) {
    spinner.error({ text: theme.error(err.message) })
  }
}

// ─── Import SQL file (BUG-4: proper statement splitting) ─────────────────────

async function importSQLFile(adapter: DbAdapter): Promise<void> {
  const { filepath } = await inquirer.prompt([{
    type: 'input', name: 'filepath', message: 'SQL file path:',
    validate: async (v: string) => {
      try { await access(v); return true } catch { return `File not found: ${v}` }
    },
  }])

  const content = await readFile(filepath, 'utf8')
  const statements = splitSQLStatements(content)
    .filter((s) => !s.match(/^--/)) // filter pure comment-only statements

  console.log(theme.muted(`\n  Found ${statements.length} statement(s) in ${filepath}\n`))

  statements.slice(0, 3).forEach((s, i) => {
    console.log(theme.dim(`  [${i + 1}] `) + theme.muted(s.slice(0, 80) + (s.length > 80 ? '...' : '')))
  })
  if (statements.length > 3) console.log(theme.muted(`  ... and ${statements.length - 3} more`))
  console.log()

  const { useTransaction } = await inquirer.prompt([{
    type: 'confirm', name: 'useTransaction',
    message: 'Wrap in transaction (rollback on error)?', default: true,
  }])
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: `Execute ${statements.length} statement(s)?`, default: true,
  }])
  if (!confirm) return

  const spinner = createSpinner(theme.primary(`Executing ${statements.length} statements...`)).start()
  let executed = 0
  try {
    if (useTransaction) await adapter.beginTransaction()
    for (const stmt of statements) {
      const res = await adapter.query(stmt)
      if (res.error) throw new Error(`Statement ${executed + 1}: ${res.error}`)
      executed++
    }
    if (useTransaction) await adapter.commitTransaction()
    spinner.success({ text: theme.success(`Executed ${executed} statement(s) successfully`) })
  } catch (err: any) {
    if (useTransaction) await adapter.rollbackTransaction().catch(() => {})
    spinner.error({ text: theme.error(err.message) })
    console.log(theme.warn(`  Rolled back. ${executed} statement(s) were executed before failure.`))
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function pickTable(tables: any[], msg = 'Select table:'): Promise<{ table: string | null }> {
  if (tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return { table: null } }
  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table', message: msg,
    choices: [
      ...tables.map((t) => ({ name: `${t.type === 'view' ? theme.accent('⬡') : theme.primary('◈')} ${t.name}`, value: t.name })),
      new inquirer.Separator(),
      { name: theme.muted('← Cancel'), value: '__cancel__' },
    ],
    pageSize: 25,
  }])
  return { table: table === '__cancel__' ? null : table }
}

function toCSV(columns: string[], rows: Record<string, any>[]): string {
  const escape = (v: any): string => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => escape(r[c])).join(',')),
  ].join('\n')
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  const lines = content.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur)
    rows.push(cols)
  }
  return rows
}
