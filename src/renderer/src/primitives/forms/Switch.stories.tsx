import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './Switch'

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    label: 'Enable feature',
  },
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: 'Off', defaultChecked: false },
        { label: 'On', defaultChecked: true },
        { label: 'Disabled off', disabled: true },
        { label: 'Disabled on', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <Switch label={label} {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}
