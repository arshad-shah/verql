import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { DatabaseNode } from './DatabaseNode'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import type { SchemaTable, SchemaObject } from '@shared/types'

// DatabaseNode is the top-level database row (multi-database servers). Expanded,
// it lists the DB's schemas as SchemaNode children. Schemas are keyed by
// connection:database in the schema store; stories seed that + the ui-store
// expand set (pattern from ExplorerTree.stories).

const CONN = 'mock-conn'
const DB = 'app_production'

const tables: SchemaTable[] = [
  { name: 'users', schema: 'public', type: 'table' },
  { name: 'organizations', schema: 'public', type: 'table' },
  { name: 'active_users', schema: 'public', type: 'view' },
]

const objects: SchemaObject[] = [
  { name: 'user_count', schema: 'public', kind: 'function', signature: '()', returnType: 'integer' },
]

interface SeedOpts {
  expanded?: boolean
  withSchemas?: boolean
  schemas?: string[]
}

function Seeded({ expanded = false, withSchemas = true, schemas = ['public', 'audit'] }: SeedOpts) {
  useEffect(() => {
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      invoke: async () => [],
      on: () => () => {},
    }
    useConnectionsStore.setState({ activeConnectionId: CONN, connections: [] })
    useUiStore.setState({
      expandedTreeNodes: new Set(expanded ? [`db:${CONN}:${DB}`] : []),
    })

    const schemaMap = new Map<string, string[]>()
    const tableMap = new Map<string, SchemaTable[]>()
    const objectMap = new Map<string, SchemaObject[]>()
    if (withSchemas) {
      schemaMap.set(`${CONN}:${DB}`, schemas)
      for (const s of schemas) {
        tableMap.set(`${CONN}:${DB}:${s}`, tables)
        objectMap.set(`${CONN}:${DB}:${s}`, objects)
      }
    }
    useSchemaStore.setState({
      schemas: schemaMap,
      tables: tableMap,
      objects: objectMap,
      filterText: '',
    })
  }, [expanded, withSchemas, schemas])

  return (
    <div style={{ width: 320, background: 'var(--color-bg-secondary)', padding: 4 }}>
      <DatabaseNode databaseName={DB} connectionId={CONN} depth={0} onExportTable={() => {}} />
    </div>
  )
}

const meta: Meta<typeof Seeded> = {
  title: 'Components/Explorer/DatabaseNode',
  component: Seeded,
}
export default meta
type Story = StoryObj<typeof meta>

/** Collapsed database row. */
export const Collapsed: Story = { args: {} }

/** Expanded, listing the database's schemas. */
export const Expanded: Story = { args: { expanded: true } }

/** Expanded while schemas are still loading. */
export const ExpandedLoading: Story = { args: { expanded: true, withSchemas: false } }

/** A database with a single schema. */
export const SingleSchema: Story = { args: { expanded: true, schemas: ['public'] } }
