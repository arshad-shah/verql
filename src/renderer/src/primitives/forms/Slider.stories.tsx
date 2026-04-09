import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Forms/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 40,
    style: { width: 240 },
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ width: 240 }}>
      <Slider min={0} max={100} defaultValue={40} />
      <Slider min={0} max={100} defaultValue={60} disabled />
    </div>
  ),
}
