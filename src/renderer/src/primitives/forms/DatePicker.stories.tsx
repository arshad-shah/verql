import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePicker } from './DatePicker'

const meta: Meta<typeof DatePicker> = {
  title: 'Primitives/Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('2026-04-09')
    return (
      <div className="w-56">
        <DatePicker value={value} onChange={setValue} />
      </div>
    )
  },
}

export const WithConstraints: Story = {
  args: { defaultValue: '2026-04-09', min: '2026-01-01', max: '2026-12-31' },
  decorators: [(Story) => <div className="w-56"><Story /></div>],
}
