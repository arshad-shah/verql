import type { Meta, StoryObj } from '@storybook/react-vite'
import { SelectorWidgetRenderer } from './SelectorWidget'
import type { SelectorWidget } from '@shared/plugin-ui-types'

// SelectorWidget reads activeConnectionId (connections store) and uses the
// plugin-ui store's resolveOptions/executeAction (both behind the globally
// stubbed window.electronAPI). With static `options` and no `resolver`, the
// effect short-circuits, so these stories render fully standalone.
const meta: Meta<typeof SelectorWidgetRenderer> = {
  title: 'Components/PluginUi/SelectorWidget',
  component: SelectorWidgetRenderer,
  args: { pluginId: 'demo-plugin' },
}
export default meta
type Story = StoryObj<typeof meta>

const base = (overrides: Partial<SelectorWidget>): SelectorWidget => ({
  id: 'selector',
  type: 'selector',
  label: 'Database',
  onChange: 'demo.setDatabase',
  ...overrides,
})

const dbOptions = [
  { value: 'app', label: 'app' },
  { value: 'analytics', label: 'analytics' },
  { value: 'staging', label: 'staging' },
]

/** Static options with a preselected value. */
export const WithOptions: Story = {
  args: { widget: base({ options: dbOptions, value: 'analytics' }) },
}

/** No value set — Select shows its placeholder / first state. */
export const NoSelection: Story = {
  args: { widget: base({ options: dbOptions }) },
}

/** Searchable selector for longer option lists. */
export const Searchable: Story = {
  args: {
    widget: base({
      label: 'Collection',
      options: Array.from({ length: 12 }, (_, i) => ({
        value: `col_${i}`,
        label: `collection_${i}`,
      })),
      value: 'col_0',
      searchable: true,
    }),
  },
}
