import type { Meta, StoryObj } from '@storybook/react-vite'
import { SchemaIcon } from './SchemaIcon'

// Static warning-coloured folder glyph marking a schema node in the explorer tree.
const meta: Meta<typeof SchemaIcon> = {
  title: 'Components/Explorer/Icons/SchemaIcon',
  component: SchemaIcon,
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
