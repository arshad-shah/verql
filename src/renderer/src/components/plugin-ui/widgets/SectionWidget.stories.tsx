import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionWidgetRenderer } from './SectionWidget'
import type { SectionWidget, Widget } from '@shared/plugin-ui-types'

// SectionWidget renders a collapsible header and recurses into WidgetRenderer
// for its children. Children may include action/selector widgets that lean on
// the plugin-ui store behind the stubbed window.electronAPI.
const meta: Meta<typeof SectionWidgetRenderer> = {
  title: 'Components/PluginUi/SectionWidget',
  component: SectionWidgetRenderer,
  args: { pluginId: 'demo-plugin' },
}
export default meta
type Story = StoryObj<typeof meta>

const children: Widget[] = [
  { id: 'c-name', type: 'text', content: 'Replica status', style: 'label' },
  { id: 'c-status', type: 'status-indicator', label: 'Healthy', icon: 'circle', status: 'ok' },
  { id: 'c-action', type: 'action-button', label: 'Failover', command: 'demo.failover', variant: 'secondary' },
]

const base = (overrides: Partial<SectionWidget>): SectionWidget => ({
  id: 'section',
  type: 'section',
  label: 'Cluster',
  children,
  ...overrides,
})

/** Expanded, collapsible section (the default). */
export const Expanded: Story = {
  args: { widget: base({ collapsible: true, collapsed: false }) },
}

/** Starts collapsed — only the header shows until clicked. */
export const Collapsed: Story = {
  args: { widget: base({ collapsible: true, collapsed: true }) },
}

/** Non-collapsible — header has no chevron and children always show. */
export const NonCollapsible: Story = {
  args: { widget: base({ label: 'Metadata', collapsible: false }) },
}
