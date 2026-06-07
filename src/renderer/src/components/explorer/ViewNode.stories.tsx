import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ViewNode } from './ViewNode'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import type { SchemaColumn } from '@shared/types'

// ViewNode mirrors TableNode for views: a collapsed eye-icon row, or an expanded
// card listing the view's columns. Columns come from the schema store keyed by
// connection:schema:view; stories seed that + the ui-store expand set.

const CONN = 'mock-conn'
const SCHEMA = 'public'

const cols: SchemaColumn[] = [
  { name: 'user_id', dataType: 'uuid', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'active_days', dataType: 'integer', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'last_seen', dataType: 'timestamptz', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
]

interface SeedOpts {
  view?: string
  expanded?: boolean
  withColumns?: boolean
  highlightQuery?: string
}

function Seeded({ view = 'active_users', expanded = false, withColumns = true, highlightQuery }: SeedOpts) {
  useEffect(() => {
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      invoke: async () => [],
      on: () => () => {},
    }
    const cacheKey = `${CONN}:${SCHEMA}:${view}`
    useConnectionsStore.setState({ activeConnectionId: CONN, connections: [] })
    useUiStore.setState({
      expandedTreeNodes: new Set(expanded ? [`view:${CONN}:${SCHEMA}:${view}`] : []),
    })
    useSchemaStore.setState({
      columns: new Map(withColumns ? [[cacheKey, cols]] : []),
      filterText: highlightQuery ?? '',
    })
  }, [view, expanded, withColumns, highlightQuery])

  return (
    <div style={{ width: 320, background: 'var(--color-bg-secondary)', padding: 4 }}>
      <ViewNode
        viewName={view}
        connectionId={CONN}
        schema={SCHEMA}
        depth={0}
        highlightQuery={highlightQuery}
      />
    </div>
  )
}

const meta: Meta<typeof Seeded> = {
  title: 'Components/Explorer/ViewNode',
  component: Seeded,
}
export default meta
type Story = StoryObj<typeof meta>

/** Collapsed view row. */
export const Collapsed: Story = { args: {} }

/** Expanded into a card listing the view's columns. */
export const Expanded: Story = { args: { expanded: true } }

/** Expanded while columns are still loading. */
export const ExpandedLoading: Story = { args: { expanded: true, withColumns: false } }

/** Collapsed row with a search highlight on the name. */
export const Highlighted: Story = { args: { highlightQuery: 'actv' } }
