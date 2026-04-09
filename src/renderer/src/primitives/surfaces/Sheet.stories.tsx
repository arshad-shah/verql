import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Sheet } from './Sheet'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/Sheet',
  component: Sheet,
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { open: false, onClose: () => {} },
  render: () => {
    const [open, setOpen] = useState(false)
    const [side, setSide] = useState<'right' | 'left' | 'bottom'>('right')
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {(['right', 'left', 'bottom'] as const).map((s) => (
          <Button key={s} variant="outline" onClick={() => { setSide(s); setOpen(true) }}>
            Open {s}
          </Button>
        ))}
        <Sheet open={open} onClose={() => setOpen(false)} side={side}>
          <div style={{ padding: 24, color: 'var(--color-text-primary)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Sheet — {side}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Slide-in panel from the {side} edge.
            </div>
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </Sheet>
      </div>
    )
  },
}
