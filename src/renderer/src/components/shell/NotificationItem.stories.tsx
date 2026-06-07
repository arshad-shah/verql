import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/stores/notifications'

const base: Notification = {
  id: 'n1',
  type: 'info',
  title: 'Query finished',
  message: 'Returned 128 rows in 42ms',
  timestamp: Date.now() - 90_000,
  read: false,
}

const meta: Meta<typeof NotificationItem> = {
  title: 'Components/Shell/NotificationItem',
  component: NotificationItem,
  parameters: { layout: 'padded' },
  args: { onClick: fn() },
  decorators: [
    (Story) => (
      <div className="w-80 bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { notification: base },
}

export const Error: Story = {
  args: {
    notification: {
      ...base,
      id: 'n2',
      type: 'error',
      message: 'Connection to prod-orders refused',
      source: { type: 'connection', id: 'c1', label: 'prod-orders' },
    },
  },
}

export const Warning: Story = {
  args: {
    notification: {
      ...base,
      id: 'n3',
      type: 'warning',
      message: '2 plugins failed to load',
      source: { type: 'plugin', id: 'system', label: 'Plugin system' },
    },
  },
}

export const SuccessRead: Story = {
  args: {
    notification: {
      ...base,
      id: 'n4',
      type: 'success',
      message: 'Export completed',
      read: true,
      timestamp: Date.now() - 7_200_000,
    },
  },
}
