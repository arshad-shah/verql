import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'

const onChangeMock = fn()

const meta: Meta<typeof ColorPicker> = {
  title: 'Primitives/Forms/ColorPicker',
  component: ColorPicker,
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ColorPicker>

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <ColorPicker
        value={color}
        onChange={(c) => { setColor(c); onChangeMock(c) }}
      />
    )
  },
  play: async ({ canvas }) => {
    // Click the RGB format button
    const rgbBtn = canvas.getByRole('button', { name: 'rgb' })
    await userEvent.click(rgbBtn)
    // Verify RGB inputs appear
    await expect(canvas.getByText('R')).toBeInTheDocument()
    await expect(canvas.getByText('G')).toBeInTheDocument()
    await expect(canvas.getByText('B')).toBeInTheDocument()
  },
}

export const WithPresets: Story = {
  render: function Render() {
    const [color, setColor] = useState('#ff5555')
    return (
      <ColorPicker
        value={color}
        onChange={setColor}
        presets={['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd']}
      />
    )
  },
}

export const NoPresets: Story = {
  render: function Render() {
    const [color, setColor] = useState('#0080ff')
    return <ColorPicker value={color} onChange={setColor} showPresets={false} />
  },
}

export const HSLFormat: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return <ColorPicker value={color} onChange={setColor} format="hsl" />
  },
}
