import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextWidgetRenderer } from './TextWidget'
import type { TextWidget } from '@shared/plugin-ui-types'

// TextWidgetRenderer is pure prop-driven: it maps `widget.style` to a token
// class and renders `widget.content`. No store/IPC involvement.
const meta: Meta<typeof TextWidgetRenderer> = {
  title: 'Components/PluginUi/TextWidget',
  component: TextWidgetRenderer,
}
export default meta
type Story = StoryObj<typeof meta>

const base = (overrides: Partial<TextWidget>): TextWidget => ({
  id: 'txt',
  type: 'text',
  content: 'Sample text',
  ...overrides,
})

/** Default `value` style — primary text color. */
export const Value: Story = {
  args: { widget: base({ content: 'public.users', style: 'value' }) },
}

/** `label` style — muted, uppercase, tracked. Used for field captions. */
export const Label: Story = {
  args: { widget: base({ content: 'Schema', style: 'label' }) },
}

/** `muted` style — disabled color for secondary detail. */
export const Muted: Story = {
  args: { widget: base({ content: '1,204 rows', style: 'muted' }) },
}

/** A hidden widget renders nothing. */
export const Hidden: Story = {
  args: { widget: base({ content: 'never shown', visible: false }) },
}
