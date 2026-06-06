import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { StatusBar } from './StatusBar'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'
import type { ConnectionProfile } from '@shared/types'

/**
 * Renders the real `StatusBar`. The previous version of this story file
 * assembled fake dock/card/badge mocks; that drifted from the production
 * status bar over time. Now we feed the real component the same store
 * state the app would, and render the same code path.
 */
const PROD: ConnectionProfile = {
  id: 'sb-prod', name: 'prod-orders', type: 'postgresql',
  host: 'db.prod.io', port: 5432, database: 'orders', username: 'reader',
  password: '', color: '#7c6ff7',
}

function seed(opts: {
  connections?: ConnectionProfile[]
  connectedIds?: string[]
  activeId?: string | null
  schema?: string | null
  unreadNotifications?: number
} = {}) {
  const {
    connections = [PROD],
    connectedIds = ['sb-prod'],
    activeId = 'sb-prod',
    schema = 'public',
    unreadNotifications = 0,
  } = opts
  useConnectionsStore.setState({
    connections,
    connectedIds: new Set(connectedIds),
    activeConnectionId: activeId,
  })
  useUiStore.setState({ activeSchema: schema } as Partial<ReturnType<typeof useUiStore.getState>>)
  // Pre-seed a few notifications when the story asks for unread > 0 so the
  // bell renders with the correct count badge.
  const ns: ReturnType<typeof useNotificationsStore.getState> = useNotificationsStore.getState()
  ns.clearAll?.()
  for (let i = 0; i < unreadNotifications; i++) {
    ns.addNotification({ type: 'error', title: `Sample ${i + 1}` })
  }
}

const meta: Meta<typeof StatusBar> = {
  title: 'Components/Shell/StatusBar',
  component: StatusBar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-bg-primary border-t border-border-default">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof StatusBar>

export const Connected: Story = {
  decorators: [(Story) => { useEffect(() => { seed() }, []); return <Story /> }],
}

export const Disconnected: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed({ connectedIds: [], activeId: null }) }, [])
      return <Story />
    },
  ],
}

export const NoConnections: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed({ connections: [], connectedIds: [], activeId: null }) }, [])
      return <Story />
    },
  ],
}

export const WithNotifications: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed({ unreadNotifications: 3 }) }, [])
      return <Story />
    },
  ],
}

export const NoSchema: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed({ schema: null }) }, [])
      return <Story />
    },
  ],
}

export const MultipleConnections: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seed({
          connections: [
            PROD,
            { ...PROD, id: 'sb-staging', name: 'staging', color: '#f59e0b' },
            { ...PROD, id: 'sb-legacy', name: 'legacy-users', type: 'mysql', color: '#ef4444' },
          ],
          connectedIds: ['sb-prod', 'sb-staging'],
          activeId: 'sb-prod',
        })
      }, [])
      return <Story />
    },
  ],
}
