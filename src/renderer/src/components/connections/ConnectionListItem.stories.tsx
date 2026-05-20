import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConnectionListItem } from './ConnectionListItem'

const baseConnection = {
  id: 'c-1',
  name: 'prod-orders',
  type: 'postgresql' as const,
  host: 'db.prod.internal',
  port: 5432,
  database: 'orders',
  username: 'app_reader',
  password: '',
  color: '#7c6ff7',
}

const meta: Meta<typeof ConnectionListItem> = {
  title: 'Components/Connections/ConnectionListItem',
  component: ConnectionListItem,
  tags: ['autodocs'],
  parameters: {
    // The row reads against the sidebar's bg-secondary surface; render it
    // there so visual review matches the production background.
    backgrounds: { default: 'bg-secondary' },
  },
  args: {
    connection: baseConnection,
    connected: true,
    active: false,
    onActivate: () => {},
    onEdit: () => {},
    onConnect: () => {},
    onDisconnect: () => {},
    onOpenQueryTab: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-80 bg-bg-secondary border border-border-default rounded-md">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ConnectionListItem>

export const ConnectedAndActive: Story = {
  args: { connected: true, active: true },
}

export const ConnectedNotActive: Story = {
  args: { connected: true, active: false },
}

export const Disconnected: Story = {
  args: { connected: false, active: false },
}

export const NoColor: Story = {
  args: {
    connection: { ...baseConnection, color: undefined },
    connected: true,
  },
}

export const LongName: Story = {
  args: {
    connection: {
      ...baseConnection,
      name: 'production-orders-replica-east-1-failover-candidate',
    },
  },
}

export const FileBackedSqlite: Story = {
  args: {
    connection: {
      ...baseConnection,
      id: 'c-2',
      type: 'sqlite' as const,
      name: 'local-dev.db',
      host: undefined,
      port: undefined,
      username: undefined,
      database: '/Users/me/projects/app/local-dev.db',
      color: '#22c55e',
    },
  },
}

export const Snowflake: Story = {
  args: {
    connection: {
      ...baseConnection,
      id: 'c-3',
      type: 'snowflake' as const,
      name: 'analytics-warehouse',
      host: 'org-account.snowflakecomputing.com',
      port: undefined,
      database: 'ANALYTICS',
      username: 'reporting',
      color: '#38bdf8',
    },
  },
}

export const UnknownEngine: Story = {
  args: {
    connection: {
      ...baseConnection,
      id: 'c-4',
      type: 'duckdb' as const,
      name: 'duck',
      color: '#facc15',
    },
    connected: false,
  },
}

