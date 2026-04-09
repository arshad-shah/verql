import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
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

const onChangeMock = fn()

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('2026-04-09')
    return (
      <div className="w-56">
        <DatePicker value={value} onChange={(next) => { setValue(next); onChangeMock(next) }} />
      </div>
    )
  },
  play: async ({ canvas }) => {
    const calendarButton = canvas.getByRole('button', { name: 'Toggle calendar' })
    await userEvent.click(calendarButton)
    const todayButton = canvas.getByRole('button', { name: 'Today' })
    await userEvent.click(todayButton)
    await expect(onChangeMock).toHaveBeenCalled()
  },
}

export const WithConstraints: Story = {
  args: { defaultValue: '2026-04-09', min: '2026-01-01', max: '2026-12-31' },
  decorators: [(Story) => <div className="w-56"><Story /></div>],
}
