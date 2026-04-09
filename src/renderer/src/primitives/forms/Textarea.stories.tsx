import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Forms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
  },
}
export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter your message\u2026',
    rows: 4,
    style: { width: 320 },
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 320 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Textarea key={size} size={size} rows={3} placeholder={`size="${size}"`} />
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 320 }}>
      <Textarea size="md" rows={3} placeholder="Default" />
      <Textarea size="md" rows={3} error defaultValue="Error state" />
      <Textarea size="md" rows={3} disabled defaultValue="Disabled" />
    </div>
  ),
}
