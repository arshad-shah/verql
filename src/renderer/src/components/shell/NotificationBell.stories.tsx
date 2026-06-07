import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { NotificationBell } from './NotificationBell'
import { useNotificationsStore, type Notification } from '@/stores/notifications'

function seed(count: number, read = false) {
  const notifications: Notification[] = Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    type: 'error',
    title: `Sample ${i + 1}`,
    timestamp: Date.now() - i * 1000,
    read,
  }))
  useNotificationsStore.setState({ notifications })
}

const meta: Meta<typeof NotificationBell> = {
  title: 'Components/Shell/NotificationBell',
  component: NotificationBell,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex w-12 items-center justify-center bg-bg-primary py-2">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** No unread notifications — no badge. */
export const Empty: Story = {
  decorators: [(Story) => { useEffect(() => { seed(0) }, []); return <Story /> }],
}

/** A few unread notifications — count badge shown. */
export const Unread: Story = {
  decorators: [(Story) => { useEffect(() => { seed(3) }, []); return <Story /> }],
}

/** Notifications exist but all are read — no badge. */
export const AllRead: Story = {
  decorators: [(Story) => { useEffect(() => { seed(4, true) }, []); return <Story /> }],
}
