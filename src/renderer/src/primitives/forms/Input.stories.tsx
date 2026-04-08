import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta = {
  title: 'Forms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter value…',
    style: { width: 280 },
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Input key={size} size={size} placeholder={`size="${size}"`} />
      ))}
    </div>
  ),
}

export const ErrorState: Story = {
  args: {
    size: 'md',
    error: true,
    defaultValue: 'invalid-value',
    style: { width: 280 },
  },
}

export const Disabled: Story = {
  args: {
    size: 'md',
    disabled: true,
    defaultValue: 'Cannot edit this',
    style: { width: 280 },
  },
}
