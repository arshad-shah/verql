import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Primitives/Forms/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Select>

const options = (
  <>
    <option value="">Choose an option\u2026</option>
    <option value="postgresql">PostgreSQL</option>
    <option value="mysql">MySQL</option>
    <option value="sqlite">SQLite</option>
    <option value="mongodb">MongoDB</option>
  </>
)

export const Default: Story = {
  args: {
    size: 'md',
    style: { width: 240 },
    children: options,
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 240 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Select key={size} size={size}>
          {options}
        </Select>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 240 }}>
      <Select size="md">{options}</Select>
      <Select size="md" disabled>{options}</Select>
    </div>
  ),
}
