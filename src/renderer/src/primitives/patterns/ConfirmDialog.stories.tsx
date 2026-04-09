import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { useState } from 'react'
import { Modal } from '../surfaces/Modal'
import { Button } from '../forms/Button'
import { Text } from '../typography/Text'

const onCancel = fn()
const onConfirm = fn()

const meta: Meta = {
  title: 'Patterns/ConfirmDialog',
  tags: ['autodocs'],
}
export default meta

export const Default: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false)

    function handleCancel() {
      onCancel()
      setOpen(false)
    }

    function handleConfirm() {
      onConfirm()
      setOpen(false)
    }

    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Drop Table
        </Button>
        <Modal open={open} onClose={handleCancel}>
          <div className="p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Drop Table?</h3>
            <Text size="sm" color="secondary">
              This will permanently delete the <strong>users</strong> table and all its data. This action cannot be undone.
            </Text>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirm}>Drop Table</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  },
  play: async ({ canvas }) => {
    // Open the dialog
    const triggerBtn = canvas.getByRole('button', { name: 'Drop Table' })
    await userEvent.click(triggerBtn)

    // Click Cancel
    const cancelBtn = canvas.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelBtn)
    await expect(onCancel).toHaveBeenCalledTimes(1)

    // Re-open and confirm — two "Drop Table" buttons exist (trigger + dialog)
    await userEvent.click(triggerBtn)
    const allDropBtns = canvas.getAllByRole('button', { name: 'Drop Table' })
    const confirmBtn = allDropBtns[allDropBtns.length - 1]
    await userEvent.click(confirmBtn)
    await expect(onConfirm).toHaveBeenCalledTimes(1)
  },
}
