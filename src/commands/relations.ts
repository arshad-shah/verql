import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import { writeFile } from 'fs/promises'
import type { DbAdapter, ColumnInfo, IndexInfo, TableInfo, ForeignKeyInfo } from '../db/adapter.js'
import type { DbType } from '../config/store.js'
import { theme, divider, stripAnsi, renderTable, padEnd } from '../ui/theme.js'
import { ph, quoteIdent } from '../utils/sql.js'

const W = () => process.stdout.columns ?? 120
const BOX_WIDTH = 36

interface FKWithCardinality extends ForeignKeyInfo {
  cardinality: 'one-to-one' | 'many-to-one'
}

interface TableData {
  name: string
  columns: ColumnInfo[]
  rowCount?: number
  indexes: IndexInfo[]
}

function formatRowCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

function cardinalityArrow(c: 'one-to-one' | 'many-to-one'): string { return c === 'one-to-one' ? '|--|' : '>--|' }
function cardinalityLabel(c: 'one-to-one' | 'many-to-one'): string { return c === 'one-to-one' ? '1:1' : 'N:1' }

async function loadSchemaData(adapter: DbAdapter, schema: string, tables: TableInfo[]): Promise<TableData[]> {
  const result: TableData[] = []
  for (const t of tables) {
    const columns = await adapter.getColumns(t.name, schema).catch(() => [])
    const indexes = await adapter.getIndexes(t.name, schema).catch(() => [])
    result.push({ name: t.name, columns, rowCount: t.rowCount ?? undefined, indexes })
  }
  return result
}

// Infer implicit FK relationships by matching column names like <table>_id
function inferImplicitFKs(
  tableDataList: TableData[],
  formalFKs: ForeignKeyInfo[],
): ForeignKeyInfo[] {
  const tableNames = new Set(tableDataList.map((t) => t.name))
  const pkByTable = new Map<string, string>()
  for (const td of tableDataList) {
    const pk = td.columns.find((c) => c.isPrimaryKey)
    if (pk) pkByTable.set(td.name, pk.name)
  }
  const colsByTable = new Map<string, Set<string>>()
  for (const td of tableDataList) colsByTable.set(td.name, new Set(td.columns.map((c) => c.name)))
  const formalSet = new Set(formalFKs.map((fk) => `${fk.fromTable}.${fk.fromColumn}`))
  const inferred: ForeignKeyInfo[] = []

  for (const td of tableDataList) {
    for (const col of td.columns) {
      if (col.isPrimaryKey) continue
      if (formalSet.has(`${td.name}.${col.name}`)) continue
      const match = col.name.match(/^(.+?)_(?:id|uuid)$/i)
      if (!match) continue
      const base = match[1]
      const candidates = [base, base + 's', base.replace(/s$/, '')]
      for (const cand of candidates) {
        if (!tableNames.has(cand) || cand === td.name) continue
        // Determine target column: prefer same-named col, else PK, else 'id'
        const targetCols = colsByTable.get(cand)
        let toCol = pkByTable.get(cand) ?? 'id'
        if (targetCols?.has(col.name)) toCol = col.name
        inferred.push({ fromTable: td.name, fromColumn: col.name, toTable: cand, toColumn: toCol })
        break
      }
    }
  }
  return inferred
}

function detectCardinality(fk: ForeignKeyInfo, indexesByTable: Map<string, IndexInfo[]>): 'one-to-one' | 'many-to-one' {
  const indexes = indexesByTable.get(fk.fromTable) ?? []
  for (const idx of indexes) {
    if (idx.unique && idx.columns.length === 1 && idx.columns[0] === fk.fromColumn) return 'one-to-one'
  }
  return 'many-to-one'
}

function enrichFKs(allFKs: ForeignKeyInfo[], indexesByTable: Map<string, IndexInfo[]>): FKWithCardinality[] {
  return allFKs.map((fk) => ({ ...fk, cardinality: detectCardinality(fk, indexesByTable) }))
}

function boxLine(content: string, inner: number): string {
  const visualLen = stripAnsi(content).length
  const pad = Math.max(0, inner - visualLen - 2)
  return theme.border('│') + ` ${content}${' '.repeat(pad)} ` + theme.border('│')
}

function formatColContent(
  col: ColumnInfo,
  fkMap: Map<string, ForeignKeyInfo>,
  cardMap: Map<string, 'one-to-one' | 'many-to-one'>,
  contentWidth: number,
): string {
  const fk = fkMap.get(col.name)
  const colorIcon = col.isPrimaryKey ? theme.accent('⚿') : (fk ? theme.warn('→') : ' ')

  let namePart = col.name
  if (fk) {
    const card = cardMap.get(col.name) ?? 'many-to-one'
    const arrow = cardinalityArrow(card)
    namePart += ` ${arrow} ${fk.toTable}`
  }

  const rawType = col.type.toUpperCase()
  const typeStr = rawType.length > 10 ? rawType.slice(0, 9) + '…' : rawType
  const nameMax = contentWidth - 2 - typeStr.length - 1
  if (namePart.length > nameMax) {
    namePart = namePart.slice(0, Math.max(3, nameMax - 1)) + '…'
  }
  const gap = Math.max(1, contentWidth - 2 - namePart.length - typeStr.length)
  return colorIcon + ' ' + namePart + ' '.repeat(gap) + theme.type_(typeStr)
}

function renderTableBox(
  td: TableData,
  fkMap: Map<string, ForeignKeyInfo>,
  cardMap: Map<string, 'one-to-one' | 'many-to-one'>,
  boxWidth: number = BOX_WIDTH,
): string[] {
  const inner = boxWidth - 2
  const contentWidth = inner - 2

  const countStr = td.rowCount != null && td.rowCount > 0
    ? ` (${formatRowCount(td.rowCount)})` : ''
  let titleText = td.name + countStr
  if (titleText.length > inner - 3) titleText = titleText.slice(0, inner - 4) + '…'
  const topFill = '─'.repeat(Math.max(0, inner - titleText.length - 3))

  const lines: string[] = []
  lines.push(theme.border('╭─ ') + theme.accent(titleText) + theme.border(` ${topFill}╮`))

  const pkCols = td.columns.filter((c) => c.isPrimaryKey)
  const nonPkCols = td.columns.filter((c) => !c.isPrimaryKey)

  for (const col of pkCols) {
    lines.push(boxLine(formatColContent(col, fkMap, cardMap, contentWidth), inner))
  }
  if (pkCols.length > 0 && nonPkCols.length > 0) {
    lines.push(theme.border(`├${'─'.repeat(inner)}┤`))
  }
  for (const col of nonPkCols) {
    lines.push(boxLine(formatColContent(col, fkMap, cardMap, contentWidth), inner))
  }
  if (td.columns.length === 0) {
    lines.push(boxLine(theme.muted('(no columns)'), inner))
  }

  lines.push(theme.border(`╰${'─'.repeat(inner)}╯`))
  return lines
}

function renderConnectionLines(enrichedFKs: FKWithCardinality[]): string[] {
  if (enrichedFKs.length === 0) return []
  const lines: string[] = ['', theme.muted('  ─── Relationships ─────────────────────────────────')]
  for (const fk of enrichedFKs) {
    const arrow = cardinalityArrow(fk.cardinality)
    const label = cardinalityLabel(fk.cardinality)
    lines.push(
      `  ${theme.value(fk.fromTable)}.${theme.warn(fk.fromColumn)} ` +
      `${theme.accent(arrow)} ` +
      `${theme.value(fk.toTable)}.${theme.success(fk.toColumn)}` +
      theme.muted(`     (${label})`)
    )
  }
  return lines
}

function renderERDiagramContent(
  tableDataList: TableData[],
  enrichedFKs: FKWithCardinality[],
  termWidth: number,
): string {
  const gap = 2
  const tablesPerRow = Math.max(1, Math.floor((termWidth - 4) / (BOX_WIDTH + gap)))

  const fksByFromTable = new Map<string, Map<string, ForeignKeyInfo>>()
  const cardsByFromTable = new Map<string, Map<string, 'one-to-one' | 'many-to-one'>>()
  for (const fk of enrichedFKs) {
    if (!fksByFromTable.has(fk.fromTable)) fksByFromTable.set(fk.fromTable, new Map())
    fksByFromTable.get(fk.fromTable)!.set(fk.fromColumn, fk)
    if (!cardsByFromTable.has(fk.fromTable)) cardsByFromTable.set(fk.fromTable, new Map())
    cardsByFromTable.get(fk.fromTable)!.set(fk.fromColumn, fk.cardinality)
  }

  const allLines: string[] = []
  for (let rowStart = 0; rowStart < tableDataList.length; rowStart += tablesPerRow) {
    const rowTables = tableDataList.slice(rowStart, rowStart + tablesPerRow)
    const boxes = rowTables.map((td) =>
      renderTableBox(td, fksByFromTable.get(td.name) ?? new Map(), cardsByFromTable.get(td.name) ?? new Map())
    )
    const maxHeight = Math.max(...boxes.map((b) => b.length))
    for (let line = 0; line < maxHeight; line++) {
      const parts = boxes.map((b) => {
        const raw = b[line] ?? ''
        const vis = stripAnsi(raw).length
        return raw + ' '.repeat(Math.max(0, BOX_WIDTH - vis))
      })
      allLines.push('  ' + parts.join(' '.repeat(gap)))
    }
    allLines.push('')
  }

  allLines.push(...renderConnectionLines(enrichedFKs))
  return allLines.join('\n')
}

async function paginateAndDisplay(content: string): Promise<void> {
  const lines = content.split('\n')
  const pageHeight = (process.stdout.rows ?? 24) - 3
  if (pageHeight <= 0 || lines.length <= pageHeight) {
    console.log(content)
    return
  }

  const pageCount = Math.ceil(lines.length / pageHeight)
  let page = 0
  while (true) {
    const start = page * pageHeight
    const pageLines = lines.slice(start, start + pageHeight)
    console.log('\n' + pageLines.join('\n'))
    console.log(theme.muted(`  [Page ${page + 1}/${pageCount}]`))

    const choices: Array<{ name: string; value: string }> = []
    if (page > 0) choices.push({ name: '← Previous page', value: 'prev' })
    if (page < pageCount - 1) choices.push({ name: '→ Next page', value: 'next' })
    choices.push({ name: 'Done', value: 'done' })
    const { nav } = await inquirer.prompt([{
      type: 'list', name: 'nav', message: 'Navigate:', choices,
    }])
    if (nav === 'prev') page--
    else if (nav === 'next') page++
    else break
  }
}

async function exportDiagram(content: string, schema: string): Promise<void> {
  const { action } = await inquirer.prompt([{
    type: 'list', name: 'action',
    message: 'What next?',
    choices: [
      { name: '→ Continue browsing', value: 'continue' },
      { name: '→ Export diagram as plain text (.txt)', value: 'txt' },
      { name: '→ Export diagram as Markdown (with code block)', value: 'md' },
      { name: '← Back', value: 'back' },
    ],
  }])

  if (action === 'back' || action === 'continue') return

  const ts = Date.now()
  const plain = stripAnsi(content)

  if (action === 'txt') {
    const filename = `er-diagram-${schema}-${ts}.txt`
    await writeFile(filename, plain, 'utf8')
    console.log(theme.success(`\n  ✓ Exported → ${filename}\n`))
  } else if (action === 'md') {
    const filename = `er-diagram-${schema}-${ts}.md`
    const md = `# ER Diagram — ${schema}\n\n\`\`\`\n${plain}\n\`\`\`\n`
    await writeFile(filename, md, 'utf8')
    console.log(theme.success(`\n  ✓ Exported → ${filename}\n`))
  }
}

async function erDiagram(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<void> {
  const spinner = createSpinner(theme.primary('Loading schema...')).start()
  try {
    const tables = await adapter.getTables(schema).catch(() => [])
    const formalFKs = await adapter.getAllForeignKeys(schema).catch(() => [])
    const tableDataList = await loadSchemaData(adapter, schema, tables)
    const inferredFKs = inferImplicitFKs(tableDataList, formalFKs)
    const allFKs = [...formalFKs, ...inferredFKs]

    const indexesByTable = new Map<string, IndexInfo[]>()
    for (const td of tableDataList) indexesByTable.set(td.name, td.indexes)
    const enrichedFKs = enrichFKs(allFKs, indexesByTable)

    spinner.stop()
    if (tableDataList.length === 0) { console.log(theme.warn('\n  No tables found in this schema.\n')); return }
    console.log('\n' + divider(`ER Diagram — ${schema} (${tableDataList.length} tables)`, W()))
    const content = renderERDiagramContent(tableDataList, enrichedFKs, W())
    await paginateAndDisplay(content)
    await exportDiagram(content, schema)
  } catch (err: any) {
    spinner.error({ text: theme.error(err.message) })
  }
}

function classifyTable(
  name: string,
  allFKs: ForeignKeyInfo[],
): { outCount: number; inCount: number; role: string } {
  const outCount = allFKs.filter((fk) => fk.fromTable === name).length
  const inCount = allFKs.filter((fk) => fk.toTable === name).length
  let role = 'Standalone'
  if (outCount > 0 && inCount > 0) role = 'Junction'
  else if (outCount > 0) role = 'Dependent'
  else if (inCount > 0) role = 'Referenced'
  return { outCount, inCount, role }
}

async function tableDetailView(
  adapter: DbAdapter, table: string, schema: string, dbType: DbType, allFKs: ForeignKeyInfo[],
): Promise<void> {
  console.log('\n' + divider(`${table} — Relationships`, W()))
  const columns = await adapter.getColumns(table, schema).catch(() => [])
  const outgoing = allFKs.filter((fk) => fk.fromTable === table)
  const incoming = allFKs.filter((fk) => fk.toTable === table)

  // Show columns with annotations
  const colRows = columns.map((c) => {
    const fk = outgoing.find((f) => f.fromColumn === c.name)
    const pk = c.isPrimaryKey ? theme.accent('PK') : ''
    const fkLabel = fk ? theme.warn('FK') : ''
    return {
      'Column': c.name, 'Type': c.type,
      'PK': pk, 'FK': fkLabel,
    }
  })
  const { output } = renderTable(['Column', 'Type', 'PK', 'FK'], colRows, { pageSize: 40 })
  console.log(output)

  if (outgoing.length > 0) {
    console.log(theme.label('\n  Outgoing FKs:'))
    for (const fk of outgoing) {
      console.log(`    ${theme.warn('→')} ${fk.fromColumn} → ${theme.value(fk.toTable)}.${fk.toColumn}` +
        (fk.deleteRule ? theme.muted(` (ON DELETE ${fk.deleteRule})`) : ''))
    }
  }
  if (incoming.length > 0) {
    console.log(theme.label('\n  Incoming FKs:'))
    for (const fk of incoming) {
      console.log(`    ${theme.success('←')} ${theme.value(fk.fromTable)}.${fk.fromColumn} → ${fk.toColumn}`)
    }
  }
  console.log()

  const { openExplorer } = await inquirer.prompt([{
    type: 'confirm', name: 'openExplorer',
    message: 'Open in Row Explorer?', default: false,
  }])
  if (openExplorer) {
    await exploreTable(adapter, table, schema, dbType, allFKs)
  }
}

async function relationshipMap(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<void> {
  const spinner = createSpinner(theme.primary('Loading relationships...')).start()
  const tables = await adapter.getTables(schema).catch(() => [])
  const formalFKs = await adapter.getAllForeignKeys(schema).catch(() => [])
  const tds = await loadSchemaData(adapter, schema, tables)
  const allFKs = [...formalFKs, ...inferImplicitFKs(tds, formalFKs)]
  spinner.stop()
  if (tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return }
  console.log()
  console.log(divider(`Relationship Map — ${schema}`, W()))
  for (const t of tables) {
    const { outCount, inCount, role } = classifyTable(t.name, allFKs)
    const out = allFKs.filter((fk) => fk.fromTable === t.name)
    const icon = outCount > 0 || inCount > 0 ? theme.primary('◉') : theme.muted('◇')
    console.log(`  ${icon} ${theme.value(t.name)}  ${theme.muted(`(→ ${outCount} out, ← ${inCount} in)`)}  [${theme.accent(role)}]`)
    for (const fk of out) {
      console.log(`      ${theme.warn('→')} ${fk.fromColumn} → ${theme.value(fk.toTable)}.${fk.toColumn}`)
    }
  }
  console.log()

  // Interactive selection
  while (true) {
    const choices = [
      ...tables.map((t) => {
        const { outCount, inCount, role } = classifyTable(t.name, allFKs)
        const icon = outCount > 0 || inCount > 0 ? '◉' : '◇'
        return {
          name: `${icon}  ${t.name}  ${theme.muted(`(→ ${outCount} out, ← ${inCount} in)`)}  [${role}]`,
          value: t.name,
        }
      }),
      new inquirer.Separator(theme.muted('─────────────────────────────────────────')),
      { name: theme.muted('← Back'), value: '__back__' },
    ]

    const { selected } = await inquirer.prompt([{
      type: 'list', name: 'selected',
      message: 'Select a table to inspect its relationships:',
      choices, pageSize: 25, loop: false,
    }])

    if (selected === '__back__') return
    await tableDetailView(adapter, selected, schema, dbType, allFKs)
  }
}

async function exploreTable(
  adapter: DbAdapter,
  table: string,
  schema: string,
  dbType: DbType,
  allFKs: ForeignKeyInfo[],
): Promise<void> {
  const result = await adapter.query(
    `SELECT * FROM ${quoteIdent(table)} LIMIT 25`
  )
  if (result.error || result.rows.length === 0) {
    console.log(theme.warn(`\n  No rows found in ${table}.\n`))
    return
  }

  const { output } = renderTable(result.columns, result.rows, { pageSize: 25 })
  console.log()
  console.log(output)

  const rowChoices = result.rows.map((row, i) => {
    const preview = result.columns.slice(0, 3).map((c) => `${c}=${row[c] ?? 'NULL'}`).join(', ')
    return { name: `Row ${i + 1}: ${preview}`, value: i }
  })
  rowChoices.push({ name: theme.muted('← Back'), value: -1 } as any)

  const { rowIdx } = await inquirer.prompt([{
    type: 'list', name: 'rowIdx',
    message: 'Select a row to explore:',
    choices: rowChoices, pageSize: 25,
  }])
  if (rowIdx === -1) return

  const columns = await adapter.getColumns(table, schema).catch(() => [])
  await exploreRow(adapter, table, result.rows[rowIdx], schema, dbType, allFKs, columns)
}

async function exploreRow(
  adapter: DbAdapter,
  table: string,
  row: Record<string, any>,
  schema: string,
  dbType: DbType,
  allFKs: ForeignKeyInfo[],
  columns: ColumnInfo[],
): Promise<void> {
  console.log()
  console.log(divider(`Row Explorer — ${table}`, W()))

  const colRows = Object.entries(row).map(([k, v]) => ({
    'Column': k, 'Value': v === null ? theme.muted('NULL') : String(v),
  }))
  console.log(renderTable(['Column', 'Value'], colRows, { pageSize: 40 }).output)

  const outgoing = allFKs.filter((fk) => fk.fromTable === table)
  const incoming = allFKs.filter((fk) => fk.toTable === table)
  const navChoices: Array<{ name: string; value: any }> = []
  for (const fk of outgoing) {
    if (row[fk.fromColumn] != null)
      navChoices.push({ name: `${theme.warn('→')} Go to ${fk.toTable}.${fk.toColumn} = ${row[fk.fromColumn]}`, value: { type: 'parent', fk, val: row[fk.fromColumn] } })
  }
  for (const fk of incoming) {
    if (columns.find((c) => c.isPrimaryKey && c.name === fk.toColumn) && row[fk.toColumn] != null)
      navChoices.push({ name: `${theme.success('←')} ${fk.fromTable}.${fk.fromColumn} = ${row[fk.toColumn]}`, value: { type: 'children', fk, val: row[fk.toColumn] } })
  }
  navChoices.push({ name: theme.muted('← Back'), value: { type: 'back' } })

  const { nav } = await inquirer.prompt([{
    type: 'list', name: 'nav',
    message: 'Navigate FK relationship:',
    choices: navChoices,
  }])

  if (nav.type === 'back') return

  if (nav.type === 'parent') {
    const targetRow = await navigateToParent(adapter, nav.fk, nav.val, dbType)
    if (targetRow) {
      const targetCols = await adapter.getColumns(nav.fk.toTable, schema).catch(() => [])
      await exploreRow(adapter, nav.fk.toTable, targetRow, schema, dbType, allFKs, targetCols)
    }
  }

  if (nav.type === 'children') {
    await navigateToChildren(adapter, nav.fk, nav.val, schema, dbType, allFKs)
  }
}

async function navigateToParent(
  adapter: DbAdapter,
  fk: ForeignKeyInfo,
  value: any,
  dbType: DbType,
): Promise<Record<string, any> | null> {
  const sql = `SELECT * FROM ${quoteIdent(fk.toTable)} WHERE ${quoteIdent(fk.toColumn)} = ${ph(dbType, 1)} LIMIT 1`
  const result = await adapter.query(sql, [value])
  if (result.error) { console.log(theme.error(`\n  ${result.error}\n`)); return null }
  if (result.rows.length === 0) { console.log(theme.warn('\n  Referenced row not found.\n')); return null }
  return result.rows[0]
}

async function navigateToChildren(
  adapter: DbAdapter,
  fk: ForeignKeyInfo,
  value: any,
  schema: string,
  dbType: DbType,
  allFKs: ForeignKeyInfo[],
): Promise<void> {
  const sql = `SELECT * FROM ${quoteIdent(fk.fromTable)} WHERE ${quoteIdent(fk.fromColumn)} = ${ph(dbType, 1)} LIMIT 50`
  const result = await adapter.query(sql, [value])
  if (result.error) { console.log(theme.error(`\n  ${result.error}\n`)); return }
  if (result.rows.length === 0) { console.log(theme.warn('\n  No child rows found.\n')); return }

  console.log(theme.label(`\n  ${result.rows.length} row(s) in ${fk.fromTable}:\n`))
  const { output } = renderTable(result.columns, result.rows, { pageSize: 25 })
  console.log(output)

  if (result.rows.length === 1) {
    const { drill } = await inquirer.prompt([{
      type: 'confirm', name: 'drill',
      message: `Explore this ${fk.fromTable} row?`, default: false,
    }])
    if (drill) {
      const cols = await adapter.getColumns(fk.fromTable, schema).catch(() => [])
      await exploreRow(adapter, fk.fromTable, result.rows[0], schema, dbType, allFKs, cols)
    }
  }
}

export async function relationshipView(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<void> {
  console.log()
  console.log(divider('Relationship View', W()))

  while (true) {
    const { view } = await inquirer.prompt([{
      type: 'list', name: 'view',
      message: 'Select view:',
      choices: [
        { name: `${theme.primary('◈')}  ER Diagram — visual table layout with FK connections`, value: 'er' },
        { name: `${theme.primary('◉')}  Relationship Map — interactive FK adjacency explorer`, value: 'map' },
        { name: `${theme.primary('⚿')}  Row Explorer — navigate data along FK paths`, value: 'row' },
        new inquirer.Separator(),
        { name: theme.muted('← Back'), value: 'back' },
      ],
    }])

    if (view === 'back') return
    if (view === 'er') await erDiagram(adapter, schema, dbType)
    if (view === 'map') await relationshipMap(adapter, schema, dbType)
    if (view === 'row') await rowExplorerEntry(adapter, schema, dbType)
  }
}

async function rowExplorerEntry(
  adapter: DbAdapter,
  schema: string,
  dbType: DbType,
): Promise<void> {
  const tables = await adapter.getTables(schema).catch(() => [])
  const formalFKs = await adapter.getAllForeignKeys(schema).catch(() => [])
  const tds = await loadSchemaData(adapter, schema, tables)
  const allFKs = [...formalFKs, ...inferImplicitFKs(tds, formalFKs)]
  if (tables.length === 0) { console.log(theme.warn('\n  No tables found.\n')); return }

  const { table } = await inquirer.prompt([{
    type: 'list', name: 'table',
    message: 'Select table to explore:',
    choices: [
      ...tables.filter((t) => t.type === 'table').map((t) => ({ name: t.name, value: t.name })),
      new inquirer.Separator(),
      { name: theme.muted('← Back'), value: '__back__' },
    ],
    pageSize: 25,
  }])
  if (table === '__back__') return

  await exploreTable(adapter, table, schema, dbType, allFKs)
}
