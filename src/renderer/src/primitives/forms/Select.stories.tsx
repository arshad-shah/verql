import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const options = (
  <>
    <option value="">Choose an option…</option>
    <option value="postgresql">PostgreSQL</option>
    <option value="mysql">MySQL</option>
    <option value="sqlite">SQLite</option>
    <option value="mongodb">MongoDB</option>
  </>
)

export const Playground: Story = {
  args: {
    size: 'md',
    style: { width: 240 },
    children: options,
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 240 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Select key={size} size={size}>{options}</Select>
      ))}
    </div>
  ),
}
