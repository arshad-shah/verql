import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TagsInput } from './TagsInput'

const meta: Meta<typeof TagsInput> = {
  title: 'Primitives/Forms/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    maxTags: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof TagsInput>

export const Default: Story = {
  render: function Render() {
    const [tags, setTags] = useState(['users', 'orders'])
    return (
      <div className="w-80">
        <TagsInput value={tags} onChange={setTags} placeholder="Add table..." />
      </div>
    )
  },
}

export const WithMaxTags: Story = {
  args: { defaultValue: ['tag1', 'tag2'], maxTags: 3, placeholder: 'Max 3 tags' },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <TagsInput defaultValue={['active']} placeholder="Default" />
      <TagsInput defaultValue={['locked']} disabled />
    </div>
  ),
}
