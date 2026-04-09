import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { NumberInput } from './NumberInput'

const meta: Meta<typeof NumberInput> = {
  title: 'Primitives/Forms/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
  },
  args: {
    onChange: fn(),
  },
}
export default meta
type Story = StoryObj<typeof NumberInput>

export const Default: Story = {
  args: { defaultValue: 42, min: 0, max: 100, step: 1, size: 'md', 'aria-label': 'Value' },
  play: async ({ canvas, args }) => {
    const incrementButton = canvas.getByRole('button', { name: 'Increment' })
    await userEvent.click(incrementButton)
    await expect(args.onChange).toHaveBeenCalledWith(43)
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <NumberInput key={size} size={size} defaultValue={10} min={0} max={99} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      <NumberInput defaultValue={50} min={0} max={100} aria-label="Default" />
      <NumberInput defaultValue={50} min={0} max={100} error aria-label="Error" />
      <NumberInput defaultValue={50} min={0} max={100} disabled aria-label="Disabled" />
    </div>
  ),
}

export const WithPrecision: Story = {
  args: { defaultValue: 3.14, step: 0.01, precision: 2, size: 'md', 'aria-label': 'Precision value' },
}
