import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Forms/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: {
    label: 'Enable feature',
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: 'Off', defaultChecked: false },
        { label: 'On', defaultChecked: true },
        { label: 'Disabled off', disabled: true },
        { label: 'Disabled on', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Switch label={label} {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}
