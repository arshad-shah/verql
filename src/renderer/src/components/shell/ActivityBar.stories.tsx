import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ActivityBar } from './ActivityBar'
import { useUiStore, ACTIVITY_PANEL, type ActivityPanel } from '@/stores/ui'

function seed(activePanel: ActivityPanel, sidebarVisible = true) {
  useUiStore.setState({ activePanel, sidebarVisible })
}

const meta: Meta<typeof ActivityBar> = {
  title: 'Components/Shell/ActivityBar',
  component: ActivityBar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-96 bg-bg-secondary">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** Explorer is the active panel (the default landing view). */
export const Explorer: Story = {
  decorators: [(Story) => { useEffect(() => { seed(ACTIVITY_PANEL.EXPLORER) }, []); return <Story /> }],
}

/** Saved-queries panel active. */
export const Queries: Story = {
  decorators: [(Story) => { useEffect(() => { seed(ACTIVITY_PANEL.QUERY) }, []); return <Story /> }],
}

/** Plugins panel active. */
export const Plugins: Story = {
  decorators: [(Story) => { useEffect(() => { seed(ACTIVITY_PANEL.PLUGINS) }, []); return <Story /> }],
}

/** Sidebar collapsed — no item shows as active. */
export const SidebarHidden: Story = {
  decorators: [(Story) => { useEffect(() => { seed(ACTIVITY_PANEL.EXPLORER, false) }, []); return <Story /> }],
}
