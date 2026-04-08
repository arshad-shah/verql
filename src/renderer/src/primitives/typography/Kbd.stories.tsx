import type { Meta, StoryObj } from '@storybook/react'
import { Kbd } from './Kbd'

const meta = {
  title: 'Typography/Kbd',
  component: Kbd,
  tags: ['autodocs'],
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: '⌘K',
  },
}

export const Combinations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        ['⌘', 'K'],
        ['Ctrl', 'Shift', 'P'],
        ['Escape'],
        ['Enter'],
        ['⌥', '⌫'],
      ].map((combo, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {combo.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </div>
      ))}
    </div>
  ),
}
