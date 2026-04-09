import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

const meta = {
  title: 'Primitives/Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    orientation: 'horizontal',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300, color: 'var(--color-text-primary)' }}>
        <div style={{ padding: '8px 0', fontSize: 12 }}>Above the divider</div>
        <Story />
        <div style={{ padding: '8px 0', fontSize: 12 }}>Below the divider</div>
      </div>
    ),
  ],
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, color: 'var(--color-text-primary)', fontSize: 12 }}>
      <span>Left</span>
      <Divider orientation="vertical" style={{ height: '100%' }} />
      <span>Right</span>
    </div>
  ),
}
