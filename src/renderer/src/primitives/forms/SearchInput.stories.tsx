import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
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

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <div className="w-72">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue('')}
          placeholder="Search tables..."
          shortcut="⌘K"
        />
      </div>
    )
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
