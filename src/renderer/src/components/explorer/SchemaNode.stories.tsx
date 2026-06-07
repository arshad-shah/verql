import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { SchemaNode } from './SchemaNode'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import type { SchemaTable, SchemaObject, SchemaColumn } from '@shared/types'

// SchemaNode is a schema folder row that, when expanded, fans out into the
// collapsible Tables/Views/Functions/Indexes/… groups. Tables + objects come
// from the schema store keyed by connection:schema; stories seed that store and
// the ui-store expand set (pattern from ExplorerTree.stories).

const CONN = 'mock-conn'
const SCHEMA = 'public'

const tables: SchemaTable[] = [
  { name: 'users', schema: SCHEMA, type: 'table' },
  { name: 'organizations', schema: SCHEMA, type: 'table' },
  { name: 'sessions', schema: SCHEMA, type: 'table' },
  { name: 'active_users', schema: SCHEMA, type: 'view' },
  { name: 'mrr_by_month', schema: SCHEMA, type: 'view' },
]

const objects: SchemaObject[] = [
  { name: 'mrr_rollup', schema: SCHEMA, kind: 'materialized_view' },
  { name: 'user_count', schema: SCHEMA, kind: 'function', signature: '()', returnType: 'integer' },
  { name: 'send_invite', schema: SCHEMA, kind: 'procedure', signature: '(text, uuid)' },
  { name: 'update_updated', schema: SCHEMA, kind: 'trigger', parent: 'users' },
  { name: 'users_id_seq', schema: SCHEMA, kind: 'sequence' },
  { name: 'users_email_idx', schema: SCHEMA, kind: 'index', parent: 'users', returnType: 'UNIQUE' },
  { name: 'pg_trgm', schema: SCHEMA, kind: 'extension' },
]

const usersCols: SchemaColumn[] = [
  { name: 'id', dataType: 'bigint', nullable: false, defaultValue: null, isPrimaryKey: true, isForeignKey: false },
  { name: 'email', dataType: 'varchar(255)', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
]

interface SeedOpts {
  expanded?: boolean
  withData?: boolean
  filter?: string
  expandTable?: boolean
}

function Seeded({ expanded = false, withData = true, filter, expandTable = false }: SeedOpts) {
  useEffect(() => {
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      invoke: async () => [],
      on: () => () => {},
    }
    const cacheKey = `${CONN}:${SCHEMA}`
    useConnectionsStore.setState({ activeConnectionId: CONN, connections: [] })

    const expand = new Set<string>()
    if (expanded) expand.add(`schema:${CONN}:${SCHEMA}`)
    if (expandTable) expand.add(`table:${CONN}:${SCHEMA}:users`)
    useUiStore.setState({ expandedTreeNodes: expand })

    useSchemaStore.setState({
      tables: new Map(withData ? [[cacheKey, tables]] : []),
      objects: new Map(withData ? [[cacheKey, objects]] : []),
      columns: new Map([[`${CONN}:${SCHEMA}:users`, usersCols]]),
      rowCounts: new Map([[`${CONN}:${SCHEMA}:users`, 12_438]]),
      indexes: new Map(),
      filterText: filter ?? '',
    })
  }, [expanded, withData, filter, expandTable])

  return (
    <div style={{ width: 320, background: 'var(--color-bg-secondary)', padding: 4 }}>
      <SchemaNode schemaName={SCHEMA} connectionId={CONN} depth={0} onExportTable={() => {}} />
    </div>
  )
}

const meta: Meta<typeof Seeded> = {
  title: 'Components/Explorer/SchemaNode',
  component: Seeded,
}
export default meta
type Story = StoryObj<typeof meta>

/** Collapsed schema folder row. */
export const Collapsed: Story = { args: {} }

/** Expanded into its category groups (Tables expanded by default). */
export const Expanded: Story = { args: { expanded: true } }

/** Expanded with a nested table card also open. */
export const ExpandedWithOpenTable: Story = {
  args: { expanded: true, expandTable: true },
}

/** Expanded while tables are still loading. */
export const ExpandedLoading: Story = { args: { expanded: true, withData: false } }

/** Expanded with an active filter — groups auto-expand, matches highlighted. */
export const Filtered: Story = { args: { expanded: true, filter: 'user' } }
