import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { PasswordInput } from './PasswordInput'

const meta: Meta<typeof PasswordInput> = {
  title: 'Primitives/Forms/PasswordInput',
  component: PasswordInput,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    onChange: fn(),
  },
}
export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: { placeholder: 'Enter password', size: 'md' },
  play: async ({ canvas, args }) => {
    const input = canvas.getByPlaceholderText('Enter password')
    await userEvent.type(input, 'secret')
    await expect(args.onChange).toHaveBeenCalled()

    const toggleButton = canvas.getByRole('button', { name: 'Show password' })
    await userEvent.click(toggleButton)
    await expect(canvas.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  },
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
