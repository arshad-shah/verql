import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef } from 'react'
import { fn } from 'storybook/test'
import { SchemaAutocomplete } from './SchemaAutocomplete'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import type { SchemaTable, SchemaColumn } from '@shared/types'

const CONN = 'conn-1'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

const tables: SchemaTable[] = [
  { name: 'users', schema: 'public', type: 'table' },
  { name: 'orders', schema: 'public', type: 'table' },
  { name: 'products', schema: 'public', type: 'table' },
]

const userColumns: SchemaColumn[] = [
  { name: 'id', dataType: 'int4', nullable: false, defaultValue: null, isPrimaryKey: true, isForeignKey: false },
  { name: 'email', dataType: 'varchar', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'created_at', dataType: 'timestamp', nullable: false, defaultValue: 'now()', isPrimaryKey: false, isForeignKey: false },
]

function seed(triggerText: string) {
  return function StoreSeeder() {
    const anchorRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      stubElectronAPI()
      useConnectionsStore.setState({ activeConnectionId: CONN })
      useSchemaStore.setState({
        tables: new Map([[`${CONN}:public`, tables]]),
        columns: new Map([[`${CONN}:public:users`, userColumns]]),
        schemas: new Map([[CONN, ['public']]]),
      })
    }, [])
    return (
      <div ref={anchorRef} style={{ position: 'relative', width: 320, height: 240 }}>
        <SchemaAutocomplete
          triggerText={triggerText}
          onSelect={fn()}
          onDismiss={fn()}
          anchorRef={anchorRef}
        />
      </div>
    )
  }
}

const meta: Meta<typeof SchemaAutocomplete> = {
  title: 'Components/AI/SchemaAutocomplete',
  component: SchemaAutocomplete,
}
export default meta
type Story = StoryObj<typeof meta>

export const AllItems: Story = { render: seed('') }
export const FilteredTables: Story = { render: seed('user') }
export const FilteredColumns: Story = { render: seed('email') }
