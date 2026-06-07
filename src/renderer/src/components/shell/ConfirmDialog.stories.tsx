import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConfirmDialog } from './ConfirmDialog'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Shell/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    title: 'Discard changes?',
    message: 'You have unsaved changes in this query. They will be lost.',
    onConfirm: fn(),
    onCancel: fn(),
  },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Danger: Story = {
  args: {
    title: 'Drop table “users”?',
    message: 'This permanently deletes the table and all of its rows. This cannot be undone.',
    variant: 'danger',
    confirmLabel: 'Drop table',
  },
}

export const CustomLabels: Story = {
  args: {
    title: 'Close all tabs?',
    message: undefined,
    confirmLabel: 'Close all',
    cancelLabel: 'Keep open',
  },
}

export const Closed: Story = {
  args: { open: false },
}
