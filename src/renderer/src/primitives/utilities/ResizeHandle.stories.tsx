import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { ResizeHandle } from './ResizeHandle'

const meta = {
  title: 'Primitives/Utilities/ResizeHandle',
  component: ResizeHandle,
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
  args: {
    onResize: fn(),
    onDoubleClick: fn(),
  },
} satisfies Meta<typeof ResizeHandle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { direction: 'horizontal' as const },
  render: () => {
    const [leftWidth, setLeftWidth] = useState(200)
    return (
      <div style={{ display: 'flex', height: 200, width: 480, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: leftWidth, flexShrink: 0, background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {leftWidth}px
        </div>
        <ResizeHandle
          direction="horizontal"
          onResize={(delta) => setLeftWidth((w) => Math.max(80, Math.min(360, w + delta)))}
          onDoubleClick={() => setLeftWidth(200)}
        />
        <div style={{ flex: 1, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Drag handle or double-click to reset
        </div>
      </div>
    )
  },
  play: async ({ canvas }) => {
    const handle = canvas.getByRole('separator')
    await expect(handle).toBeInTheDocument()
    // Keyboard resize: ArrowRight moves the handle
    handle.focus()
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard('{ArrowLeft}')
  },
}

export const Vertical: Story = {
  args: { direction: 'vertical' as const },
  render: () => {
    const [topHeight, setTopHeight] = useState(100)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 300, width: 360, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ height: topHeight, flexShrink: 0, background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {topHeight}px
        </div>
        <ResizeHandle
          direction="vertical"
          onResize={(delta) => setTopHeight((h) => Math.max(40, Math.min(240, h + delta)))}
          onDoubleClick={() => setTopHeight(100)}
        />
        <div style={{ flex: 1, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Drag handle or double-click to reset
        </div>
      </div>
    )
  },
  play: async ({ canvas }) => {
    const handle = canvas.getByRole('separator')
    await expect(handle).toBeInTheDocument()
    handle.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowUp}')
  },
}
