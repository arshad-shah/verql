import type { Meta, StoryObj } from '@storybook/react'
import { IconButton } from './Button'

const meta = {
  title: 'Forms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    label: 'Settings',
    children: '⚙',
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <IconButton key={size} size={size} label={`${size} button`}>✕</IconButton>
      ))}
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <IconButton key={variant} variant={variant} label={`${variant} button`}>★</IconButton>
      ))}
    </div>
  ),
}
