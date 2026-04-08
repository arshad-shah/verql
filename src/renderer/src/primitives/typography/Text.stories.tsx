import type { Meta, StoryObj } from '@storybook/react'
import { Text } from './Text'

const meta = {
  title: 'Typography/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    truncate: { control: 'boolean' },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    size: 'sm',
    color: 'primary',
    weight: 'normal',
    children: 'The quick brown fox jumps over the lazy dog',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['xs', 'sm', 'base', 'lg', 'xl'] as const).map((size) => (
        <Text key={size} size={size}>
          size="{size}" — The quick brown fox
        </Text>
      ))}
    </div>
  ),
}

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'] as const).map((color) => (
        <Text key={color} color={color}>
          color="{color}" — The quick brown fox
        </Text>
      ))}
    </div>
  ),
}
