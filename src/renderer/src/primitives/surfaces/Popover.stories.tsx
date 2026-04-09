import type { Meta, StoryObj } from '@storybook/react'
import { Popover } from './Popover'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { trigger: null as any, content: null as any },
  render: () => (
    <Popover
      trigger={<Button variant="outline">Open Popover</Button>}
      content={
        <div style={{ padding: 12, minWidth: 200, color: 'var(--color-text-primary)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Popover title</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Popover body content. Uses the native Popover API.
          </div>
        </div>
      }
    />
  ),
}
