import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { ContextMenu } from './ContextMenu'

const meta = {
  title: 'Primitives/Surfaces/ContextMenu',
  component: ContextMenu,
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
  play: async ({ canvas }) => {
    const target = canvas.getByText('Right-click here to open context menu')

    await userEvent.pointer({ keys: '[MouseRight]', target })

    const openInNewTab = canvas.getByRole('menuitem', { name: 'Open in new tab' })
    await expect(openInNewTab).toBeVisible()

    await userEvent.click(openInNewTab)
    await expect(onOpenInNewTab).toHaveBeenCalledTimes(1)
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ContextMenu
          key={size}
          size={size}
          items={[
            { label: 'Open in new tab', onSelect: fn() },
            { label: 'Copy path', onSelect: fn() },
            { label: 'Rename', onSelect: fn() },
            { label: 'Delete', onSelect: fn() },
          ]}
        >
          <div style={{
            width: 200,
            height: 100,
            border: '2px dashed var(--color-border-default)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            userSelect: 'none',
          }}>
            Right-click — size="{size}"
          </div>
        </ContextMenu>
      ))}
    </div>
  ),
}

export const WithDisabledItems: Story = {
  render: () => (
    <ContextMenu
      items={[
        { label: 'Open in new tab', onSelect: fn() },
        { label: 'Copy path', onSelect: fn() },
        { label: 'Rename', onSelect: fn(), disabled: true },
        { label: 'Delete', onSelect: fn(), disabled: true },
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
        Right-click to see disabled items
      </div>
    </ContextMenu>
  ),
  play: async ({ canvas }) => {
    const target = canvas.getByText('Right-click to see disabled items')

    await userEvent.pointer({ keys: '[MouseRight]', target })

    const renameItem = canvas.getByRole('menuitem', { name: 'Rename' })
    await expect(renameItem).toBeDisabled()

    const deleteItem = canvas.getByRole('menuitem', { name: 'Delete' })
    await expect(deleteItem).toBeDisabled()

    const openInNewTab = canvas.getByRole('menuitem', { name: 'Open in new tab' })
    await expect(openInNewTab).not.toBeDisabled()
  },
}
