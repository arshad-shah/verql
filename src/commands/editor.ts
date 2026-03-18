import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import type { DbAdapter, ColumnInfo } from '../db/adapter.js'
import type { DbType } from '../config/store.js'
import { theme, box, divider, renderTable } from '../ui/theme.js'
import { quoteIdent, quoteTable, placeholder, buildPlaceholders } from '../utils/sql.js'
import { ValidationError, printError } from '../utils/errors.js'

const W = () => process.stdout.columns ?? 120

export async function dataEditor(
  adapter: DbAdapter,
  table: string,
  schema: string,
  dbType: DbType = 'postgresql',
): Promise<void> {
  console.log()
  console.log(divider(`Data Editor — ${table}`, W()))

  while (true) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: `${theme.value(table)} — edit data:`,
      choices: [
        { name: `${theme.success('＋')}  Insert new row`, value: 'insert' },
        { name: `${theme.warn('✎')}  Edit existing row`, value: 'update' },
        { name: `${theme.error('✕')}  Delete row(s)`, value: 'delete' },
        { name: `${theme.primary('▶')}  Preview data`, value: 'preview' },
        new inquirer.Separator(),
        { name: theme.muted('← Back'), value: 'back' },
      ],
    }])

    if (action === 'back') return
    if (action === 'insert') await insertRow(adapter, table, schema, dbType)
    if (action === 'update') await updateRow(adapter, table, schema, dbType)
    if (action === 'delete') await deleteRows(adapter, table, schema, dbType)
    if (action === 'preview') await previewRows(adapter, table, schema, dbType)
  }
}

// ─── Insert ───────────────────────────────────────────────────────────────────

async function insertRow(adapter: DbAdapter, table: string, schema: string, dbType: DbType): Promise<void> {
  const spinner = createSpinner(theme.muted('Loading columns...')).start()
  const columns = await adapter.getColumns(table, schema).catch(() => [])
  spinner.stop()

  if (columns.length === 0) {
    console.log(theme.error('\n  Could not load columns.\n'))
    return
  }

  console.log()
  console.log(theme.label('  Fill in values (leave blank to use DEFAULT or NULL):'))
  console.log()

  const editableCols = columns.filter((c) => !c.defaultValue?.includes('nextval') && !c.defaultValue?.includes('gen_random'))
  const values: Record<string, any> = {}

  for (const col of editableCols) {
    const hint = [
      col.type,
      col.isPrimaryKey ? theme.accent('PK') : '',
      col.nullable ? theme.muted('nullable') : theme.warn('required'),
      col.defaultValue ? theme.muted(`default: ${col.defaultValue}`) : '',
    ].filter(Boolean).join('  ')

    let parsed: any = null
    while (true) {
      const { val } = await inquirer.prompt([{
        type: 'input',
        name: 'val',
        message: `${theme.value(col.name)} ${theme.muted(`(${hint})`)}:`,
        default: '',
      }])
      if (val === '') { parsed = null; break }
      try {
        parsed = parseValue(val, col.type)
        break
      } catch (e: any) {
        printError(e, `Invalid value for ${col.name}`)
      }
    }
    values[col.name] = parsed
  }

  const colNames = Object.keys(values).filter((k) => values[k] !== null)
  const colVals = colNames.map((k) => values[k])
  const phs = buildPlaceholders(colNames.length, dbType)
  const tableName = quoteTable(table, schema, dbType)

  // Show preview
  console.log()
  console.log(theme.label('  Preview INSERT:'))
  const sql = `INSERT INTO ${tableName} (${colNames.map(quoteIdent).join(', ')})\nVALUES (${phs.join(', ')});`
  console.log(theme.dim('  ┌─────────────────────────────────────────────'))
  sql.split('\n').forEach((l) => console.log(theme.muted('  │ ') + l))
  console.log(theme.dim('  └─────────────────────────────────────────────'))
  console.log()

  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm', message: 'Execute INSERT?', default: true,
  }])
  if (!confirm) return

  const result = await adapter.query(
    `INSERT INTO ${tableName} (${colNames.map(quoteIdent).join(', ')}) VALUES (${phs.join(', ')})`,
    colVals,
  )

  if (result.error) {
    console.log(box('Insert Failed', [theme.error(result.error)], W(), theme.error))
  } else {
    console.log(theme.success(`\n  ✓ Row inserted (${result.duration}ms)\n`))
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

async function updateRow(adapter: DbAdapter, table: string, schema: string, dbType: DbType): Promise<void> {
  const columns = await adapter.getColumns(table, schema).catch(() => [])
  const pkCols = columns.filter((c) => c.isPrimaryKey)

  if (pkCols.length === 0) {
    console.log(theme.warn('\n  Table has no primary key — use the SQL Editor for manual UPDATEs.\n'))
    return
  }

  console.log()
  console.log(theme.label('  Identify the row by primary key:'))

  const whereValues: Record<string, any> = {}
  for (const pk of pkCols) {
    const { val } = await inquirer.prompt([{
      type: 'input', name: 'val',
      message: `${theme.accent('⚿')} ${theme.value(pk.name)} (${pk.type}):`,
    }])
    try {
      whereValues[pk.name] = parseValue(val, pk.type)
    } catch (e: any) {
      printError(e, `Invalid value for ${pk.name}`)
      return
    }
  }

  // Fetch existing row
  const tableName = quoteTable(table, schema, dbType)
  const whereClause = pkCols.map((c, i) => `${quoteIdent(c.name)} = ${placeholder(i + 1, dbType)}`).join(' AND ')
  const existing = await adapter.query(
    `SELECT * FROM ${tableName} WHERE ${whereClause}`,
    Object.values(whereValues),
  )

  if (existing.error || existing.rows.length === 0) {
    console.log(theme.warn('\n  Row not found.\n'))
    return
  }

  const row = existing.rows[0]
  const editableCols = columns.filter((c) => !c.isPrimaryKey)

  console.log()
  console.log(theme.label('  Edit values (press Enter to keep current):'))
  console.log()

  const updates: Record<string, any> = {}
  for (const col of editableCols) {
    const current = row[col.name] ?? ''
    const { val } = await inquirer.prompt([{
      type: 'input', name: 'val',
      message: `${theme.value(col.name)} ${theme.muted(`(${col.type})`)}:`,
      default: String(current),
    }])
    try {
      const newVal = val === '' ? null : parseValue(val, col.type)
      if (String(newVal) !== String(current)) updates[col.name] = newVal
    } catch (e: any) {
      printError(e, `Invalid value for ${col.name}`)
      return
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log(theme.muted('\n  No changes made.\n'))
    return
  }

  // Show diff
  console.log()
  console.log(theme.label('  Changes:'))
  for (const [k, v] of Object.entries(updates)) {
    console.log(`  ${theme.label(k.padEnd(20))} ${theme.error(String(row[k] ?? 'NULL'))}  →  ${theme.success(String(v ?? 'NULL'))}`)
  }
  console.log()

  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm', message: 'Execute UPDATE?', default: true,
  }])
  if (!confirm) return

  const setCols = Object.keys(updates)
  const setClause = setCols.map((c, i) => `${quoteIdent(c)} = ${placeholder(i + 1, dbType)}`).join(', ')
  const whereClause2 = pkCols.map((c, i) => `${quoteIdent(c.name)} = ${placeholder(setCols.length + i + 1, dbType)}`).join(' AND ')
  const params = [...Object.values(updates), ...Object.values(whereValues)]

  const result = await adapter.query(
    `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause2}`,
    params,
  )

  if (result.error) {
    console.log(box('Update Failed', [theme.error(result.error)], W(), theme.error))
  } else {
    console.log(theme.success(`\n  ✓ ${result.affectedRows ?? 1} row(s) updated (${result.duration}ms)\n`))
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteRows(adapter: DbAdapter, table: string, schema: string, dbType: DbType): Promise<void> {
  const columns = await adapter.getColumns(table, schema).catch(() => [])
  const pkCols = columns.filter((c) => c.isPrimaryKey)
  const tableName = quoteTable(table, schema, dbType)

  const { mode } = await inquirer.prompt([{
    type: 'list', name: 'mode',
    message: 'Delete mode:',
    choices: [
      { name: 'Delete by primary key', value: 'pk', disabled: pkCols.length === 0 ? 'No PK on this table' : false },
      { name: 'Delete by WHERE condition (custom SQL)', value: 'where' },
      { name: theme.error('Truncate table (delete ALL rows)'), value: 'truncate' },
    ],
  }])

  if (mode === 'truncate') {
    const total = await adapter.getTableRowCount(table, schema).catch(() => '?')
    // SEC-4: Require typing table name to confirm TRUNCATE
    console.log(theme.error(`\n  IRREVERSIBLE: This will delete ALL ${total} row(s) from ${table}.`))
    const { typedName } = await inquirer.prompt([{
      type: 'input', name: 'typedName',
      message: `Type the table name "${table}" to confirm:`,
    }])
    if (typedName !== table) {
      console.log(theme.muted('\n  Cancelled — name did not match.\n'))
      return
    }
    try {
      await adapter.truncateTable(table, schema)
      console.log(theme.success(`\n  ✓ Table ${table} truncated.\n`))
    } catch (err: any) {
      console.log(theme.error(`\n  Failed: ${err.message}\n`))
    }
    return
  }

  if (mode === 'where') {
    const { condition } = await inquirer.prompt([{
      type: 'input', name: 'condition',
      message: `WHERE condition ${theme.muted('(e.g. age > 30)')}:`,
      validate: (v: string) => v.trim().length > 0 || 'Condition is required',
    }])
    const preview = await adapter.query(
      `SELECT COUNT(*) as n FROM ${tableName} WHERE ${condition}`)
    if (preview.error) { console.log(theme.error(`\n  Invalid condition: ${preview.error}\n`)); return }
    const count = preview.rows[0]?.n ?? 0
    const { confirm } = await inquirer.prompt([{
      type: 'confirm', name: 'confirm',
      message: theme.error(`Delete ${count} row(s) WHERE ${condition}?`), default: false,
    }])
    if (!confirm) return
    const result = await adapter.query(`DELETE FROM ${tableName} WHERE ${condition}`)
    if (result.error) console.log(theme.error(`\n  Failed: ${result.error}\n`))
    else console.log(theme.success(`\n  ✓ ${result.affectedRows ?? count} row(s) deleted.\n`))
    return
  }

  // PK mode
  console.log()
  const whereValues: Record<string, any> = {}
  for (const pk of pkCols) {
    const { val } = await inquirer.prompt([{
      type: 'input', name: 'val',
      message: `${theme.accent('⚿')} ${theme.value(pk.name)} (${pk.type}):`,
    }])
    try {
      whereValues[pk.name] = parseValue(val, pk.type)
    } catch (e: any) {
      printError(e, `Invalid value for ${pk.name}`)
      return
    }
  }

  const whereClause = pkCols.map((c, i) => `${quoteIdent(c.name)} = ${placeholder(i + 1, dbType)}`).join(' AND ')
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: theme.error(`Delete this row from ${table}?`), default: false,
  }])
  if (!confirm) return
  const result = await adapter.query(
    `DELETE FROM ${tableName} WHERE ${whereClause}`,
    Object.values(whereValues),
  )
  if (result.error) console.log(theme.error(`\n  Failed: ${result.error}\n`))
  else console.log(theme.success(`\n  ✓ Row deleted.\n`))
}

// ─── Preview ──────────────────────────────────────────────────────────────────

async function previewRows(adapter: DbAdapter, table: string, schema: string, dbType: DbType): Promise<void> {
  const { limit } = await inquirer.prompt([{
    type: 'list', name: 'limit',
    message: 'How many rows?',
    choices: ['25', '50', '100', '250', '500', 'All (no limit)'].map((v) => ({
      name: v, value: v === 'All (no limit)' ? '999999' : v,
    })),
    default: '50',
  }])

  const { filter } = await inquirer.prompt([{
    type: 'input', name: 'filter',
    message: `WHERE clause ${theme.muted('(optional, e.g. age > 30)')}:`,
    default: '',
  }])

  const where = filter.trim() ? ` WHERE ${filter}` : ''
  const result = await adapter.query(
    `SELECT * FROM ${quoteTable(table, schema, dbType)}${where} LIMIT ${limit}`)

  if (result.error) { console.log(theme.error(`\n  ${result.error}\n`)); return }

  let page = 0
  while (true) {
    console.log()
    const { output, pageCount } = renderTable(result.columns, result.rows, { page, pageSize: 30 })
    console.log(output)
    if (pageCount <= 1) break
    const navChoices: any[] = []
    if (page > 0) navChoices.push({ name: '← Previous', value: 'prev' })
    if (page < pageCount - 1) navChoices.push({ name: '→ Next', value: 'next' })
    navChoices.push({ name: 'Done', value: 'back' })
    const { nav } = await inquirer.prompt([{ type: 'list', name: 'nav', message: 'Navigate:', choices: navChoices }])
    if (nav === 'prev') page--
    else if (nav === 'next') page++
    else break
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseValue(val: string, type: string): any {
  if (val === 'null' || val === 'NULL' || val === '') return null
  const t = type.toLowerCase()
  if (t.includes('int') || t.includes('serial') || t === 'bigint' || t === 'smallint') {
    const result = parseInt(val, 10)
    if (Number.isNaN(result)) throw new ValidationError(`'${val}' is not a valid ${type.toUpperCase()}`, type, val)
    return result
  }
  if (t.includes('float') || t.includes('real') || t.includes('double') || t.includes('numeric') || t.includes('decimal')) {
    const result = parseFloat(val)
    if (Number.isNaN(result)) throw new ValidationError(`'${val}' is not a valid ${type.toUpperCase()}`, type, val)
    return result
  }
  if (t === 'boolean' || t === 'bool') return val === 'true' || val === '1' || val === 'yes'
  return val
}
