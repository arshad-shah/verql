import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { TableNode } from './TableNode'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import type { SchemaColumn, SchemaIndex } from '@shared/types'

// TableNode is a tree row that, when collapsed, shows name + row-count + hover
// actions, and when expanded becomes a contained card listing its columns and
// stat pills. Data comes from the schema store keyed by connection:schema:table;
// the stories seed that store + the ui-store expand set (pattern from
// ExplorerTree.stories / AutoCompactBanner.stories).

const CONN = 'mock-conn'
const SCHEMA = 'public'

const cols: SchemaColumn[] = [
  { name: 'id', dataType: 'bigint', nullable: false, defaultValue: 'nextval(...)', isPrimaryKey: true, isForeignKey: false },
  { name: 'org_id', dataType: 'uuid', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: true, references: { table: 'organizations', column: 'id' } },
  { name: 'email', dataType: 'varchar(255)', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'created_at', dataType: 'timestamptz', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false },
]

const indexes: SchemaIndex[] = [
  { name: 'users_pkey', columns: ['id'], unique: true },
  { name: 'users_email_idx', columns: ['email'], unique: true },
]

interface SeedOpts {
  table?: string
  expanded?: boolean
  rowCount?: number
  withColumns?: boolean
  withIndexes?: boolean
  highlightQuery?: string
}

function Seeded({
  table = 'users',
  expanded = false,
  rowCount,
  withColumns = true,
  withIndexes = true,
  highlightQuery,
}: SeedOpts) {
  useEffect(() => {
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      invoke: async () => [],
      on: () => () => {},
    }
    const cacheKey = `${CONN}:${SCHEMA}:${table}`
    useConnectionsStore.setState({ activeConnectionId: CONN, connections: [] })
    useUiStore.setState({
      expandedTreeNodes: new Set(expanded ? [`table:${CONN}:${SCHEMA}:${table}`] : []),
    })
    useSchemaStore.setState({
      columns: new Map(withColumns ? [[cacheKey, cols]] : []),
      indexes: new Map(withIndexes ? [[cacheKey, indexes]] : []),
      rowCounts: new Map(rowCount !== undefined ? [[cacheKey, rowCount]] : []),
      filterText: highlightQuery ?? '',
    })
  }, [table, expanded, rowCount, withColumns, withIndexes, highlightQuery])

  return (
    <div style={{ width: 320, background: 'var(--color-bg-secondary)', padding: 4 }}>
      <TableNode
        tableName={table}
        connectionId={CONN}
        schema={SCHEMA}
        depth={0}
        highlightQuery={highlightQuery}
        onExportTable={() => {}}
      />
    </div>
  )
}

const meta: Meta<typeof Seeded> = {
  title: 'Components/Explorer/TableNode',
  component: Seeded,
}
export default meta
type Story = StoryObj<typeof meta>

/** Collapsed row with a formatted row-count. */
export const Collapsed: Story = { args: { rowCount: 12_438 } }

/** Collapsed with a large row-count (rendered as "2.1M"). */
export const CollapsedLargeCount: Story = {
  args: { table: 'events', rowCount: 2_104_882 },
}

/** Expanded into a card: stat pills + the column list. */
export const Expanded: Story = { args: { expanded: true, rowCount: 12_438 } }

/** Expanded while columns are still loading. */
export const ExpandedLoading: Story = {
  args: { expanded: true, rowCount: 12_438, withColumns: false },
}

/** Collapsed row with a search highlight on the name. */
export const Highlighted: Story = {
  args: { rowCount: 412, highlightQuery: 'usr' },
}
