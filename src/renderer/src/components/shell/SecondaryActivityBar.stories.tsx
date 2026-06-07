import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { SecondaryActivityBar } from './SecondaryActivityBar'
import { useUiStore, SECONDARY_PANEL, type SecondaryPanelId } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'

function seed(panel: SecondaryPanelId, visible = true, unread = 0) {
  useUiStore.setState({ secondaryActivePanel: panel, secondarySidebarVisible: visible })
  useNotificationsStore.setState({
    notifications: Array.from({ length: unread }, (_, i) => ({
      id: `n${i}`, type: 'info' as const, title: `n${i}`, timestamp: Date.now(), read: false,
    })),
  })
}

const meta: Meta<typeof SecondaryActivityBar> = {
  title: 'Components/Shell/SecondaryActivityBar',
  component: SecondaryActivityBar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-96 justify-end bg-bg-secondary">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Inspector panel active. */
export const Inspector: Story = {
  decorators: [(Story) => { useEffect(() => { seed(SECONDARY_PANEL.INSPECTOR) }, []); return <Story /> }],
}

/** Connections panel active. */
export const Connections: Story = {
  decorators: [(Story) => { useEffect(() => { seed(SECONDARY_PANEL.CONNECTIONS) }, []); return <Story /> }],
}

/** Activity panel active, with unread notifications on the bell. */
export const ActivityWithUnread: Story = {
  decorators: [(Story) => { useEffect(() => { seed(SECONDARY_PANEL.ACTIVITY, true, 3) }, []); return <Story /> }],
}

/** Sidebar collapsed — nothing reads as active. */
export const SidebarHidden: Story = {
  decorators: [(Story) => { useEffect(() => { seed(SECONDARY_PANEL.INSPECTOR, false) }, []); return <Story /> }],
}
