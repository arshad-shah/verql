import type { Meta, StoryObj } from '@storybook/react'
import { PasswordInput } from './PasswordInput'

const meta: Meta<typeof PasswordInput> = {
  title: 'Primitives/Forms/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showStrength: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: { placeholder: 'Enter password', size: 'md' },
}

export const WithStrengthMeter: Story = {
  args: { defaultValue: 'MyP@ss123', showStrength: true, size: 'md' },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <PasswordInput placeholder="Default" />
      <PasswordInput placeholder="Error" error />
      <PasswordInput placeholder="Disabled" disabled />
    </div>
  ),
}
