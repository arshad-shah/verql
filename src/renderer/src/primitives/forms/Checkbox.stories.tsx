import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Forms/Checkbox',
  component: Checkbox,
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: { 'aria-label': 'Toggle option', onChange: fn() },
  play: async ({ args, canvas }) => {
    const checkbox = canvas.getByRole('checkbox')
    await userEvent.click(checkbox)
    await expect(args.onChange).toHaveBeenCalledOnce()
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <label key={size} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Checkbox size={size} defaultChecked aria-label={`size ${size}`} />
          {size}
        </label>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: 'Unchecked', defaultChecked: false },
        { label: 'Checked', defaultChecked: true },
        { label: 'Disabled', disabled: true },
        { label: 'Disabled + checked', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Checkbox {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}
