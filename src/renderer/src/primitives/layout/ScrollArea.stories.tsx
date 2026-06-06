import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollArea } from './ScrollArea'

const meta = {
  title: 'Primitives/Layout/ScrollArea',
  component: ScrollArea,
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal', 'both'],
    },
  },
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    direction: 'vertical',
    style: { height: 150, width: 300, border: '1px solid var(--color-border-default)', borderRadius: 6 },
  },
  render: (args) => (
    <ScrollArea {...args} aria-label="Scrollable rows">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ padding: '6px 12px', fontSize: 12, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          Row {i + 1} — scrollable content
        </div>
      ))}
    </ScrollArea>
  ),
}

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea direction="horizontal" aria-label="Scrollable items" style={{ width: 300, border: '1px solid var(--color-border-default)', borderRadius: 6 }}>
      <div style={{ display: 'flex', gap: 8, padding: 12, width: 'max-content' }}>
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} style={{ flexShrink: 0, padding: '6px 12px', background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 12, color: 'var(--color-text-primary)' }}>
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
