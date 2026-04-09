import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ColorInput } from './ColorInput'

const meta: Meta<typeof ColorInput> = {
  title: 'Primitives/Forms/ColorInput',
  component: ColorInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    showPicker: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof ColorInput>

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <div className="w-48">
        <ColorInput value={color} onChange={setColor} />
      </div>
    )
  },
}

export const WithPresets: Story = {
  args: {
    defaultValue: '#7c6ff7',
    presets: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#7c6ff7', '#61afef'],
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}
