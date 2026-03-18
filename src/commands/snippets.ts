import inquirer from 'inquirer'
import type { DbAdapter } from '../db/adapter.js'
import type { DbType } from '../config/store.js'
import {
  getSavedQueries, saveQuery, updateSavedQuery, deleteSavedQuery,
  type SavedQuery,
} from '../config/store.js'
import { theme, divider, highlightSQL } from '../ui/theme.js'

const W = () => process.stdout.columns ?? 120

export async function savedQueriesMenu(
  adapter: DbAdapter,
  dbType: DbType,
  onExecute: (sql: string) => Promise<void>,
): Promise<void> {
  console.log()
  console.log(divider('Saved Queries', W()))

  while (true) {
    const queries = getSavedQueries(dbType)

    const choices: any[] = []

    if (queries.length > 0) {
      choices.push(new inquirer.Separator(theme.muted('─── Your Saved Queries ─────────────────────')))
      for (const q of queries) {
        const tags = q.tags?.length ? theme.muted(` [${q.tags.join(', ')}]`) : ''
        const desc = q.description ? theme.muted(`  ${q.description}`) : ''
        choices.push({
          name: `${theme.accent('★')} ${theme.value(q.name)}${tags}${desc}`,
          value: { action: 'open', query: q },
        })
      }
    }

    choices.push(new inquirer.Separator(theme.muted('─── Actions ────────────────────────────────')))
    choices.push({ name: `${theme.success('＋')}  Save new query`, value: { action: 'new' } })
    if (queries.length > 0) {
      choices.push({ name: `${theme.error('✕')}  Delete a query`, value: { action: 'delete' } })
    }
    choices.push(new inquirer.Separator())
    choices.push({ name: theme.muted('← Back'), value: { action: 'back' } })

    const { choice } = await inquirer.prompt([{
      type: 'list', name: 'choice',
      message: queries.length === 0
        ? 'No saved queries yet — save one from the SQL editor!'
        : 'Select a query:',
      choices, pageSize: 25, loop: false,
    }])

    if (choice.action === 'back') return
    if (choice.action === 'new') await saveNewQuery(dbType)
    if (choice.action === 'delete') await deleteQuery()
    if (choice.action === 'open') await openQuery(choice.query, adapter, dbType, onExecute)
  }
}

async function openQuery(
  q: SavedQuery,
  adapter: DbAdapter,
  dbType: DbType,
  onExecute: (sql: string) => Promise<void>,
): Promise<void> {
  console.log()
  console.log(theme.label('  Query: ') + theme.value(q.name))
  if (q.description) console.log(theme.muted(`  ${q.description}`))
  if (q.tags?.length) console.log(theme.muted(`  Tags: ${q.tags.join(', ')}`))
  console.log()
  console.log(theme.dim('  ' + '─'.repeat(W() - 4)))
  q.sql.split('\n').forEach((l) => console.log('  ' + highlightSQL(l)))
  console.log(theme.dim('  ' + '─'.repeat(W() - 4)))
  console.log()

  const { action } = await inquirer.prompt([{
    type: 'list', name: 'action',
    message: 'What to do with this query?',
    choices: [
      { name: `${theme.accent('▶')}  Run`, value: 'run' },
      { name: `${theme.warn('✎')}  Edit`, value: 'edit' },
      { name: `${theme.muted('←')}  Back`, value: 'back' },
    ],
  }])

  if (action === 'run') await onExecute(q.sql)
  if (action === 'edit') await editQuery(q, dbType)
}

async function saveNewQuery(dbType: DbType): Promise<void> {
  const { sql } = await inquirer.prompt([{
    type: 'input', name: 'sql',
    message: 'SQL (paste single line — or use SQL Editor to run first, then save from history):',
    validate: (v: string) => v.trim().length > 0 || 'SQL is required',
  }])
  const { name } = await inquirer.prompt([{
    type: 'input', name: 'name',
    message: 'Query name:',
    validate: (v: string) => v.trim().length > 0 || 'Name is required',
  }])
  const { description } = await inquirer.prompt([{
    type: 'input', name: 'description', message: 'Description (optional):', default: '',
  }])
  const { tags } = await inquirer.prompt([{
    type: 'input', name: 'tags',
    message: 'Tags (comma-separated, optional):',
    default: '',
  }])

  const savedTags = tags.trim() ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined

  saveQuery({
    name: name.trim(),
    sql: sql.trim(),
    description: description.trim() || undefined,
    tags: savedTags,
    connectionType: dbType,
  })
  console.log(theme.success(`\n  ✓ Query "${name}" saved.\n`))
}

async function editQuery(q: SavedQuery, dbType: DbType): Promise<void> {
  const { name } = await inquirer.prompt([{
    type: 'input', name: 'name', message: 'Name:', default: q.name,
  }])
  const { description } = await inquirer.prompt([{
    type: 'input', name: 'description', message: 'Description:', default: q.description ?? '',
  }])
  const { tags } = await inquirer.prompt([{
    type: 'input', name: 'tags', message: 'Tags (comma-separated):',
    default: q.tags?.join(', ') ?? '',
  }])
  const { sql } = await inquirer.prompt([{
    type: 'input', name: 'sql', message: 'SQL:', default: q.sql,
  }])

  updateSavedQuery(q.id, {
    name: name.trim(),
    description: description.trim() || undefined,
    tags: tags.trim() ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
    sql: sql.trim(),
  })
  console.log(theme.success(`\n  ✓ Query "${name}" updated.\n`))
}

async function deleteQuery(): Promise<void> {
  const queries = getSavedQueries()
  const { toDelete } = await inquirer.prompt([{
    type: 'checkbox', name: 'toDelete',
    message: 'Select queries to delete:',
    choices: queries.map((q) => ({ name: `${theme.value(q.name)} ${theme.muted(q.description ?? '')}`, value: q.id })),
    pageSize: 20,
  }])
  if (toDelete.length === 0) return
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: theme.error(`Delete ${toDelete.length} query/queries?`), default: false,
  }])
  if (confirm) {
    toDelete.forEach((id: string) => deleteSavedQuery(id))
    console.log(theme.success(`\n  ✓ Deleted ${toDelete.length} query/queries.\n`))
  }
}

// ── Helper: save from SQL editor ─────────────────────────────────────────────

export async function promptSaveQuery(sql: string, dbType: DbType): Promise<void> {
  const { name } = await inquirer.prompt([{
    type: 'input', name: 'name',
    message: 'Save as:',
    validate: (v: string) => v.trim().length > 0 || 'Name required',
  }])
  const { description } = await inquirer.prompt([{
    type: 'input', name: 'description', message: 'Description (optional):', default: '',
  }])

  saveQuery({
    name: name.trim(),
    sql,
    description: description.trim() || undefined,
    connectionType: dbType,
  })
  console.log(theme.success(`  ✓ Saved as "${name}"\n`))
}
