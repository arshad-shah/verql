import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { fn } from 'storybook/test'
import { ConnectionSegment } from './ConnectionSegment'
import { useConnectionsStore } from '@/stores/connections'
import type { ConnectionProfile } from '@shared/types'

const PROD: ConnectionProfile = {
  id: 'sb-prod', name: 'prod-orders', type: 'postgresql',
  host: 'db.prod.io', port: 5432, database: 'orders', username: 'reader',
  password: '', color: '#7c6ff7',
}

function seed(opts: {
  connections?: ConnectionProfile[]
  connectedIds?: string[]
  activeId?: string | null
} = {}) {
  const {
    connections = [PROD],
    connectedIds = ['sb-prod'],
    activeId = 'sb-prod',
  } = opts
  useConnectionsStore.setState({
    connections,
    connectedIds: new Set(connectedIds),
    activeConnectionId: activeId,
  })
}

const meta: Meta<typeof ConnectionSegment> = {
  title: 'Components/Shell/StatusBar/ConnectionSegment',
  component: ConnectionSegment,
  parameters: { layout: 'centered' },
  args: { onNewConnection: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Connected: Story = {
  decorators: [(Story) => { useEffect(() => { seed() }, []); return <Story /> }],
}

export const Disconnected: Story = {
  decorators: [
    (Story) => { useEffect(() => { seed({ connectedIds: [], activeId: 'sb-prod' }) }, []); return <Story /> },
  ],
}

export const NoConnection: Story = {
  decorators: [
    (Story) => { useEffect(() => { seed({ connections: [], connectedIds: [], activeId: null }) }, []); return <Story /> },
  ],
}

export const MySQL: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seed({
          connections: [{ ...PROD, id: 'my', name: 'legacy-users', type: 'mysql', color: '#ef4444' }],
          connectedIds: ['my'],
          activeId: 'my',
        })
      }, [])
      return <Story />
    },
  ],
}
