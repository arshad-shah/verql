import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Radio } from './Radio'

const meta: Meta<typeof Radio> = {
  title: 'Primitives/Forms/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Radio>

export const Default: Story = {
  args: {
    name: 'default',
    value: 'option',
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio')
    await userEvent.click(radio)
    await expect(args.onChange).toHaveBeenCalledOnce()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: 'Unselected', name: 'states', value: 'a' },
        { label: 'Selected', name: 'states', value: 'b', defaultChecked: true },
        { label: 'Disabled', name: 'states-disabled', value: 'c', disabled: true },
        { label: 'Disabled + selected', name: 'states-disabled-sel', value: 'd', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}

export const RadioGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'].map((db, i) => (
        <label key={db} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio name="db" value={db.toLowerCase()} defaultChecked={i === 0} />
          {db}
        </label>
      ))}
    </div>
  ),
}
