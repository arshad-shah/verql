import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActionButtonWidgetRenderer } from './ActionButtonWidget'
import type { ActionButtonWidget } from '@shared/plugin-ui-types'

// On click the widget calls usePluginUIStore().executeAction, which invokes the
// PLUGINS_UI_ACTION IPC channel. window.electronAPI is globally stubbed in
// Storybook, so the click is a harmless no-op here.
const meta: Meta<typeof ActionButtonWidgetRenderer> = {
  title: 'Components/PluginUi/ActionButtonWidget',
  component: ActionButtonWidgetRenderer,
  args: { pluginId: 'demo-plugin' },
}
export default meta
type Story = StoryObj<typeof meta>

const base = (overrides: Partial<ActionButtonWidget>): ActionButtonWidget => ({
  id: 'action',
  type: 'action-button',
  label: 'Run',
  command: 'demo.run',
  ...overrides,
})

/** Primary variant → solid Button. */
export const Primary: Story = {
  args: { widget: base({ label: 'Apply migration', command: 'demo.migrate', variant: 'primary' }) },
}

/** Secondary variant → outline Button. */
export const Secondary: Story = {
  args: { widget: base({ label: 'Preview', command: 'demo.preview', variant: 'secondary' }) },
}

/** Ghost variant (also the default when no variant is set). */
export const Ghost: Story = {
  args: { widget: base({ label: 'Refresh', command: 'demo.refresh', variant: 'ghost' }) },
}
