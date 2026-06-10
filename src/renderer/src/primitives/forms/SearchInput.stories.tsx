import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Primitives/Forms/SearchInput',
  component: SearchInput,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof SearchInput>

const onChangeMock = fn()

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <div className="w-72">
        <SearchInput
          value={value}
          onChange={(v) => {
            setValue(v)
            onChangeMock(v)
          }}
          placeholder="Search tables..."
        />
      </div>
    )
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('searchbox')
    await userEvent.type(input, 'users')
    await expect(onChangeMock).toHaveBeenCalledWith('users')
    // Built-in clear button resets the value through onChange('').
    const clear = canvas.getByRole('button', { name: /clear/i })
    await userEvent.click(clear)
    await expect(onChangeMock).toHaveBeenLastCalledWith('')
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <SearchInput placeholder="Default" />
      <SearchInput placeholder="Disabled" disabled />
    </div>
  ),
}
