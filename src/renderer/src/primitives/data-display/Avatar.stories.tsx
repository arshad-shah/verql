import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta = {
  title: 'Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    name: { control: 'text' },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} name="John Doe" size={size} />
      ))}
    </div>
  ),
}

export const InitialsVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Alice Brown', 'Bob Smith', 'Charlie D', 'E', 'First Last Name'].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </div>
  ),
}
