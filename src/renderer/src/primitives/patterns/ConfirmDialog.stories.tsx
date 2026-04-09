import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal } from '../surfaces/Modal'
import { Button } from '../forms/Button'
import { Text } from '../typography/Text'

const meta: Meta = {
  title: 'Patterns/ConfirmDialog',
  tags: ['autodocs'],
}
export default meta

export const Default: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Drop Table
        </Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Drop Table?</h3>
            <Text size="sm" color="secondary">
              This will permanently delete the <strong>users</strong> table and all its data. This action cannot be undone.
            </Text>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>Drop Table</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  },
}
