import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './Slider'

const meta = {
  title: 'Forms/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 40,
    style: { width: 240 },
  },
}

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 60,
    disabled: true,
    style: { width: 240 },
  },
}
