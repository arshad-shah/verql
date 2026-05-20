import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ActiveConnectionsPanel } from './ActiveConnectionsPanel'
import { useConnectionsStore } from '@/stores/connections'
import type { ConnectionProfile } from '@shared/types'

/**
 * Storybook story for the real `ActiveConnectionsPanel`.
 *
 * The panel reads from the zustand connections store, which would normally
 * be populated by an IPC call to the main process. Instead of mocking the
 * whole component, we seed the actual store via a decorator before render —
 * so the story exercises the exact component the app ships, just with
 * fixture data substituted at the bottom of the dependency tree.
 *
 * This is the pattern to copy for any store-bound component: feed the real
 * stores, then render the real component. No replicas, no shims.
 */
function seedConnections(connections: ConnectionProfile[], connected: string[], activeId: string | null) {
  useConnectionsStore.setState({
    connections,
    connectedIds: new Set(connected),
    activeConnectionId: activeId,
  })
}

const PROFILES: ConnectionProfile[] = [
  { id: 'c-1', name: 'prod-orders',    type: 'postgresql', host: 'db.prod.io',     port: 5432, database: 'orders',   username: 'app_reader', password: '', color: '#7c6ff7' },
  { id: 'c-2', name: 'staging-orders', type: 'postgresql', host: 'db.staging.io',  port: 5432, database: 'orders',   username: 'app_admin',  password: '', color: '#f59e0b' },
  { id: 'c-3', name: 'legacy-users',   type: 'mysql',      host: 'mysql.legacy',   port: 3306, database: 'users',    username: 'root',       password: '', color: '#ef4444' },
  { id: 'c-4', name: 'events-store',   type: 'mongodb',    host: 'mongo.events',   port: 27017, database: 'events',  username: 'app',        password: '', color: '#22c55e' },
  { id: 'c-5', name: 'local-dev.db',   type: 'sqlite',                                          database: '/Users/me/projects/local-dev.db', password: '', color: '#0ea5e9' },
  { id: 'c-6', name: 'analytics',      type: 'snowflake',  host: 'org-account.snowflakecomputing.com',                                  database: 'ANALYTICS', username: 'reporting', password: '', color: '#38bdf8' },
]

const meta: Meta<typeof ActiveConnectionsPanel> = {
  title: 'Components/Connections/ActiveConnectionsPanel',
  component: ActiveConnectionsPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      // Sized to the real secondary-sidebar width so spacing/truncation read true.
      <div className="w-72 bg-bg-secondary border border-border-default rounded-md h-[480px] overflow-auto">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ActiveConnectionsPanel>

/**
 * Mixed live + saved state. Two connections are connected, one is the
 * active one for new query tabs.
 */
export const Default: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seedConnections(PROFILES, ['c-1', 'c-2', 'c-6'], 'c-1')
      }, [])
      return <Story />
    },
  ],
}

export const Empty: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seedConnections([], [], null)
      }, [])
      return <Story />
    },
  ],
}

export const AllSaved: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seedConnections(PROFILES, [], null)
      }, [])
      return <Story />
    },
  ],
}

export const AllLive: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seedConnections(PROFILES, PROFILES.map(p => p.id), 'c-3')
      }, [])
      return <Story />
    },
  ],
}

export const Single: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seedConnections([PROFILES[0]], ['c-1'], 'c-1')
      }, [])
      return <Story />
    },
  ],
}
