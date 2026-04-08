import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'

const meta = {
  title: 'Data Display/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    style: { width: 240, height: 16 },
  },
}

export const CardSkeleton: Story = {
  render: () => (
    <div style={{ width: 280, padding: 16, border: '1px solid var(--color-border-default)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton style={{ height: 16, width: '60%' }} />
      <Skeleton style={{ height: 12, width: '90%' }} />
      <Skeleton style={{ height: 12, width: '75%' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Skeleton style={{ height: 28, width: 72, borderRadius: 6 }} />
        <Skeleton style={{ height: 28, width: 60, borderRadius: 6 }} />
      </div>
    </div>
  ),
}

export const TableSkeleton: Story = {
  render: () => (
    <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton style={{ height: 14, width: 120 }} />
          <Skeleton style={{ height: 14, width: 80 }} />
          <Skeleton style={{ height: 14, flex: 1 }} />
        </div>
      ))}
    </div>
  ),
}
