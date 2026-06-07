import type { Meta, StoryObj } from '@storybook/react-vite'
import { WidgetRenderer } from './WidgetRenderer'
import type { Widget } from '@shared/plugin-ui-types'

// WidgetRenderer is the dispatcher: it maps each widget descriptor in `widgets`
// to its renderer by `type`. Action/selector widgets call into the plugin-ui
// store (behind the globally stubbed window.electronAPI), so the whole tree
// renders standalone in Storybook.
const meta: Meta<typeof WidgetRenderer> = {
  title: 'Components/PluginUi/WidgetRenderer',
  component: WidgetRenderer,
  args: { pluginId: 'demo-plugin' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

/** A mix of the primitive widget types rendered in sequence. */
export const MixedWidgets: Story = {
  args: {
    widgets: [
      { id: 'w-label', type: 'text', content: 'Connection', style: 'label' },
      { id: 'w-value', type: 'text', content: 'prod-postgres', style: 'value' },
      { id: 'w-status', type: 'status-indicator', label: 'Connected', icon: 'circle', status: 'ok' },
      { id: 'w-sep', type: 'separator' },
      {
        id: 'w-select',
        type: 'selector',
        label: 'Schema',
        onChange: 'demo.setSchema',
        value: 'public',
        options: [
          { value: 'public', label: 'public' },
          { value: 'audit', label: 'audit' },
        ],
      },
      { id: 'w-action', type: 'action-button', label: 'Refresh', command: 'demo.refresh', variant: 'primary' },
    ] satisfies Widget[],
  },
}

/** A section nesting other widgets — exercises the recursive render path. */
export const NestedSection: Story = {
  args: {
    widgets: [
      {
        id: 'w-section',
        type: 'section',
        label: 'Replicas',
        collapsible: true,
        children: [
          { id: 's-1', type: 'status-indicator', label: 'replica-1', icon: 'circle', status: 'ok' },
          { id: 's-2', type: 'status-indicator', label: 'replica-2', icon: 'circle', status: 'warning' },
          { id: 's-3', type: 'status-indicator', label: 'replica-3', icon: 'circle', status: 'error' },
        ],
      },
    ] satisfies Widget[],
  },
}

/** Hidden widgets are skipped; only visible ones render. */
export const RespectsVisibility: Story = {
  args: {
    widgets: [
      { id: 'v-1', type: 'text', content: 'Shown', style: 'value' },
      { id: 'v-2', type: 'text', content: 'Hidden', style: 'value', visible: false },
      { id: 'v-3', type: 'status-indicator', label: 'Also shown', icon: 'circle', status: 'ok' },
    ] satisfies Widget[],
  },
}

/** Empty widget list renders nothing. */
export const Empty: Story = {
  args: { widgets: [] },
}
