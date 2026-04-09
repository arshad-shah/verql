import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Primitives/Forms/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    shortcut: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof SearchInput>

const onChangeMock = fn()
const onClearMock = fn()

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <div className="w-72">
        <SearchInput
          value={value}
          onChange={(e) => { setValue(e.target.value); onChangeMock(e) }}
          onClear={() => { setValue(''); onClearMock() }}
          placeholder="Search tables..."
          shortcut="⌘K"
        />
      </div>
    )
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox')
    await userEvent.type(input, 'users')
    await expect(onChangeMock).toHaveBeenCalled()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <SearchInput placeholder="Default" shortcut="⌘K" />
      <SearchInput placeholder="Loading..." loading />
      <SearchInput placeholder="Disabled" disabled />
    </div>
  ),
}
