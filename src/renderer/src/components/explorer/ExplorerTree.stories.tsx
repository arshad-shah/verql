import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, type ReactNode } from 'react'
import { ExplorerTree } from './ExplorerTree'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import type { SchemaTable, SchemaColumn, SchemaIndex, SchemaObject } from '@shared/types'

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONN = 'mock-conn'

const usersCols: SchemaColumn[] = [
  { name: 'id',         dataType: 'bigint',     nullable: false, defaultValue: 'nextval(...)', isPrimaryKey: true,  isForeignKey: false },
  { name: 'org_id',     dataType: 'uuid',       nullable: false, defaultValue: null,           isPrimaryKey: false, isForeignKey: true, references: { table: 'organizations', column: 'id' } },
  { name: 'email',      dataType: 'varchar(255)', nullable: false, defaultValue: null,         isPrimaryKey: false, isForeignKey: false },
  { name: 'created_at', dataType: 'timestamptz', nullable: false, defaultValue: 'now()',       isPrimaryKey: false, isForeignKey: false },
]

const orgCols: SchemaColumn[] = [
  { name: 'id',   dataType: 'uuid',         nullable: false, defaultValue: null, isPrimaryKey: true,  isForeignKey: false },
  { name: 'name', dataType: 'varchar(120)', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'plan', dataType: 'text',         nullable: true,  defaultValue: null, isPrimaryKey: false, isForeignKey: false },
]

const sampleTables: SchemaTable[] = [
  { name: 'users',         schema: 'public', type: 'table' },
  { name: 'organizations', schema: 'public', type: 'table' },
  { name: 'sessions',      schema: 'public', type: 'table' },
  { name: 'invoices',      schema: 'public', type: 'table' },
  { name: 'audit_log',     schema: 'public', type: 'table' },
  { name: 'active_users',  schema: 'public', type: 'view' },
  { name: 'mrr_by_month',  schema: 'public', type: 'view' },
]

const sampleIndexes: SchemaIndex[] = [
  { name: 'users_pkey',          columns: ['id'],     unique: true },
  { name: 'users_email_idx',     columns: ['email'],  unique: true },
  { name: 'users_org_id_idx',    columns: ['org_id'], unique: false },
]

const sampleObjects: SchemaObject[] = [
  { name: 'mrr_rollup',     schema: 'public', kind: 'materialized_view' },
  { name: 'user_count',     schema: 'public', kind: 'function',  signature: '()',           returnType: 'integer' },
  { name: 'send_invite',    schema: 'public', kind: 'procedure', signature: '(text, uuid)' },
  { name: 'update_updated', schema: 'public', kind: 'trigger',   parent: 'users' },
  { name: 'users_id_seq',   schema: 'public', kind: 'sequence' },
  { name: 'users_email_idx', schema: 'public', kind: 'index',    parent: 'users', returnType: 'UNIQUE' },
  { name: 'users_pkey',      schema: 'public', kind: 'index',    parent: 'users', returnType: 'PRIMARY' },
  { name: 'pg_trgm',         schema: 'public', kind: 'extension' },
  { name: 'uuid-ossp',       schema: 'public', kind: 'extension' },
]

// ─── Decorator: install a stub IPC bridge + seed stores ───────────────────────

interface SeedOptions {
  connected?: boolean
  databases?: string[]
  schemas?: string[]
  tables?: SchemaTable[]
  objects?: SchemaObject[]
  expand?: string[]
  filter?: string
  /** Skip seeding so the "loading" state shows. */
  skipSchemaSeed?: boolean
}

function useSeedStores(opts: SeedOptions) {
  useEffect(() => {
    // Stub the IPC bridge so the components don't error on lazy fetches.
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      invoke: async (channel: string, _id: string, name?: string) => {
        if (channel === 'db:get-columns') {
          if (name === 'users') return usersCols
          if (name === 'organizations') return orgCols
          return []
        }
        if (channel === 'db:get-indexes') return name === 'users' ? sampleIndexes : []
        if (channel === 'db:get-row-count') {
          if (name === 'users') return 12_438
          if (name === 'organizations') return 412
          if (name === 'sessions') return 2_104_882
          return 0
        }
        if (channel === 'db:sample-query') return `SELECT * FROM ${name} LIMIT 100;`
        return null
      },
      on: () => () => {},
    }

    // Reset
    useSchemaStore.setState({
      tables: new Map(),
      columns: new Map(),
      indexes: new Map(),
      schemas: new Map(),
      databases: new Map(),
      objects: new Map(),
      rowCounts: new Map(),
      filterText: opts.filter ?? '',
    })
    useConnectionsStore.setState({
      activeConnectionId: opts.connected === false ? null : CONN,
      connectedIds: opts.connected === false ? new Set() : new Set([CONN]),
    })
    useUiStore.setState({ expandedTreeNodes: new Set(opts.expand ?? []) })

    if (!opts.skipSchemaSeed && opts.connected !== false) {
      const schemas = opts.schemas ?? ['public']
      const databases = opts.databases ?? []
      const tables = opts.tables ?? sampleTables
      const objects = opts.objects ?? sampleObjects

      const next = useSchemaStore.getState()
      const dbMap = new Map(next.databases)
      dbMap.set(CONN, databases)

      const schemaMap = new Map(next.schemas)
      if (databases.length > 0) {
        for (const db of databases) schemaMap.set(`${CONN}:${db}`, schemas)
      } else {
        schemaMap.set(CONN, schemas)
      }

      const tableMap = new Map(next.tables)
      const objectMap = new Map(next.objects)
      const rowCountMap = new Map(next.rowCounts)
      const colMap = new Map(next.columns)

      const seedSchema = (key: string) => {
        tableMap.set(key, tables)
        objectMap.set(key, objects)
      }
      if (databases.length > 0) {
        for (const db of databases) for (const s of schemas) seedSchema(`${CONN}:${db}:${s}`)
      } else {
        for (const s of schemas) seedSchema(`${CONN}:${s}`)
      }

      // Pre-seed columns + row counts for tables so expanded cards render fully
      for (const t of tables) {
        const ck = `${CONN}:${schemas[0]}:${t.name}`
        if (t.name === 'users') { colMap.set(ck, usersCols); rowCountMap.set(ck, 12_438) }
        if (t.name === 'organizations') { colMap.set(ck, orgCols); rowCountMap.set(ck, 412) }
      }

      useSchemaStore.setState({
        databases: dbMap,
        schemas: schemaMap,
        tables: tableMap,
        objects: objectMap,
        rowCounts: rowCountMap,
        columns: colMap,
      })
    }
  }, [opts])
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 320,
        height: 560,
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--color-bg-secondary)',
      }}
    >
      {children}
    </div>
  )
}

function TreeStory(opts: SeedOptions) {
  useSeedStores(opts)
  return (
    <Frame>
      <ExplorerTree />
    </Frame>
  )
}

const meta = {
  title: 'Components/Explorer/ExplorerTree',
  component: TreeStory,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TreeStory>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ──────────────────────────────────────────────────────────────────

export const NoConnection: Story = {
  name: 'No connection',
  args: { connected: false },
}

export const Loading: Story = {
  name: 'Loading hierarchy',
  args: { connected: true, skipSchemaSeed: true },
}

export const FlatSqlite: Story = {
  name: 'Flat (single DB + schema, e.g. SQLite)',
  args: { schemas: ['main'], tables: sampleTables, objects: [] },
}

export const FlatEmpty: Story = {
  name: 'Flat — no tables',
  args: { schemas: ['main'], tables: [], objects: [] },
}

export const SingleDbMultiSchema: Story = {
  name: 'Single DB, multiple schemas',
  args: {
    schemas: ['public', 'analytics', 'auth'],
    expand: [`schema:${CONN}:public`],
  },
}

export const SchemaFullyExpanded: Story = {
  name: 'Schema with everything expanded',
  args: {
    schemas: ['public', 'analytics'],
    expand: [
      `schema:${CONN}:public`,
      `table:${CONN}:public:users`,
    ],
  },
}

export const MultiDatabase: Story = {
  name: 'Multiple databases',
  args: {
    databases: ['app_production', 'app_staging', 'rdsadmin'],
    schemas: ['public', 'audit'],
    expand: [
      `db:${CONN}:app_production`,
      `schema:${CONN}:app_production:public`,
    ],
  },
}

export const Filtered: Story = {
  name: 'With search filter',
  args: {
    schemas: ['public'],
    filter: 'use',
    expand: [`schema:${CONN}:public`],
  },
}
