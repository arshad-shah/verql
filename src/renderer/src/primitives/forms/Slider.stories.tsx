import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Forms/Slider',
  component: Slider,
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
    'aria-label': 'Volume',
    style: { width: 240 },
    onChange: fn(),
  },
  play: async ({ canvas }) => {
    const slider = canvas.getByRole('slider')
    await expect(slider).toHaveValue('40')
    await expect(slider).toBeEnabled()
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ width: 240 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Slider key={size} size={size} min={0} max={100} defaultValue={50} aria-label={`size ${size}`} />
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ width: 240 }}>
      <Slider min={0} max={100} defaultValue={40} aria-label="Active slider" />
      <Slider min={0} max={100} defaultValue={60} disabled aria-label="Disabled slider" />
    </div>
  ),
}
