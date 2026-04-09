import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  title: 'Primitives/Forms/Label',
  component: Label,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: {
    children: 'Database host',
  },
}
