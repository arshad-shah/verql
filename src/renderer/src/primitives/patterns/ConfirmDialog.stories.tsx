import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'

/**
 * Renders the real `ConfirmDialog` from `components/shell/`. The original
 * version of this file assembled a confirm UI from Modal + Button + Text
 * primitives, which drifted from the component the app actually mounts.
 * Storybook now exercises the same code path that ships.
 */
const meta: Meta<typeof ConfirmDialog> = {
  title: 'Patterns/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    title: 'Discard changes?',
    message: 'Query 3 has unsaved changes. Close anyway?',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    variant: 'danger',
    onCancel: fn(),
    onConfirm: fn(),
  },
}
export default meta
type Story = StoryObj<typeof ConfirmDialog>

export const Danger: Story = {}

export const Default: Story = {
  args: {
    title: 'Run this query?',
    message: 'It returned 2.3M rows last time and took 45s.',
    confirmLabel: 'Run',
    cancelLabel: 'Cancel',
    variant: 'default',
  },
}

export const NoMessage: Story = {
  args: {
    title: 'Disconnect prod-orders?',
    message: undefined,
    confirmLabel: 'Disconnect',
    variant: 'danger',
  },
}

export const Closed: Story = {
  args: { open: false },
}
