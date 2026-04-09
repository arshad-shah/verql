import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ContextMenu } from './ContextMenu'

const meta = {
  title: 'Primitives/Surfaces/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

const onOpenInNewTab = fn()
const onCopyPath = fn()
const onRename = fn()
const onDelete = fn()

export const Default: Story = {
  render: () => (
    <ContextMenu
      items={[
        { label: 'Open in new tab', onSelect: onOpenInNewTab },
        { label: 'Copy path', onSelect: onCopyPath },
        { label: 'Rename', onSelect: onRename },
        { label: 'Delete', onSelect: onDelete },
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
