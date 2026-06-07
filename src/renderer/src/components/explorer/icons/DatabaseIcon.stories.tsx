import type { Meta, StoryObj } from '@storybook/react-vite'
import { DatabaseIcon } from './DatabaseIcon'

// Static info-coloured glyph marking a database node in the explorer tree.
const meta: Meta<typeof DatabaseIcon> = {
  title: 'Components/Explorer/Icons/DatabaseIcon',
  component: DatabaseIcon,
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
