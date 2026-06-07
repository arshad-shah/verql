import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusIndicatorWidgetRenderer } from './StatusIndicatorWidget'
import type { StatusIndicatorWidget } from '@shared/plugin-ui-types'

// Prop-driven: a colored dot (keyed by `status`) plus a small label.
const meta: Meta<typeof StatusIndicatorWidgetRenderer> = {
  title: 'Components/PluginUi/StatusIndicatorWidget',
  component: StatusIndicatorWidgetRenderer,
}
export default meta
type Story = StoryObj<typeof meta>

const base = (overrides: Partial<StatusIndicatorWidget>): StatusIndicatorWidget => ({
  id: 'status',
  type: 'status-indicator',
  label: 'Connected',
  icon: 'circle',
  ...overrides,
})

/** Healthy / connected — green dot. */
export const Ok: Story = {
  args: { widget: base({ label: 'Connected', status: 'ok' }) },
}

/** Warning — amber dot. */
export const Warning: Story = {
  args: { widget: base({ label: 'Replica lag', status: 'warning' }) },
}

/** Error — red dot. */
export const Error: Story = {
  args: { widget: base({ label: 'Disconnected', status: 'error' }) },
}

/** Loading — pulsing accent dot. */
export const Loading: Story = {
  args: { widget: base({ label: 'Connecting…', status: 'loading' }) },
}
