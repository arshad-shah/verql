import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
import { ColorInput } from './ColorInput'

const meta: Meta<typeof ColorInput> = {
  title: 'Primitives/Forms/ColorInput',
  component: ColorInput,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    showPicker: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof ColorInput>

const onChangeMock = fn()

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <div className="w-48">
        <ColorInput value={color} onChange={(next) => { setColor(next); onChangeMock(next) }} />
      </div>
    )
  },
  play: async ({ canvas }) => {
    // Verify initial value
    const input = canvas.getByRole('textbox')
    await expect(input).toHaveValue('#7c6ff7')
    // Open picker
    const swatch = canvas.getByLabelText('Pick color')
    await userEvent.click(swatch)
    // Verify picker panel appeared — format buttons visible
    await expect(canvas.getByRole('button', { name: 'hex' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'rgb' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'hsl' })).toBeInTheDocument()
  },
}

export const WithPresets: Story = {
  args: {
    defaultValue: '#7c6ff7',
    presets: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#7c6ff7', '#61afef'],
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <ColorInput key={size} defaultValue="#7c6ff7" size={size} />
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    defaultValue: '#7c6ff7',
    disabled: true,
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}
