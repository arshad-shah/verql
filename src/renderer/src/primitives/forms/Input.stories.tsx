import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Primitives/Forms/Input',
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
}
export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    size: 'md',
    placeholder: 'Enter value\u2026',
    style: { width: 280 },
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('textbox')
    await userEvent.type(input, 'hello')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 280 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Input key={size} size={size} placeholder={`size="${size}"`} />
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-2" style={{ width: 280 }}>
      <Input size="md" placeholder="Default" />
      <Input size="md" error defaultValue="Error state" />
      <Input size="md" disabled defaultValue="Disabled" />
    </div>
  ),
}
