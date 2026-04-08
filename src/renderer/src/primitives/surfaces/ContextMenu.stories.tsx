import type { Meta, StoryObj } from '@storybook/react'
import { ContextMenu } from './ContextMenu'

const meta = {
  title: 'Surfaces/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: () => (
    <ContextMenu
      items={[
        { label: 'Open in new tab', onSelect: () => {} },
        { label: 'Copy path', onSelect: () => {} },
        { label: 'Rename', onSelect: () => {} },
        { label: 'Delete', onSelect: () => {} },
      ]}
    >
      <div style={{
        width: 280,
        height: 120,
        border: '2px dashed var(--color-border-default)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        userSelect: 'none',
      }}>
        Right-click here to open context menu
      </div>
    </ContextMenu>
  ),
}
