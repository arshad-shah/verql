import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './Text'

const meta = {
  title: 'Primitives/Typography/Text',
  component: Text,
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

export const Default: Story = {
  args: {
    size: 'sm',
    color: 'primary',
    weight: 'normal',
    children: 'The quick brown fox jumps over the lazy dog',
  },
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Sizes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['xs', 'sm', 'base', 'lg', 'xl'] as const).map((size) => (
            <Text key={size} size={size}>
              size="{size}" — The quick brown fox
            </Text>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Colors</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'] as const).map((color) => (
            <Text key={color} color={color}>
              color="{color}" — The quick brown fox
            </Text>
          ))}
        </div>
      </div>
    </div>
  ),
}
