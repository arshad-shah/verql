import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn, expect, userEvent } from 'storybook/test'
import { Modal } from './Modal'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { open: false, onClose: fn() },
  render: (args) => {
    const [open, setOpen] = useState(false)
    const handleClose = () => {
      setOpen(false)
      args.onClose()
    }
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={handleClose}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Confirm action</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Are you sure you want to proceed? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button variant="danger" onClick={handleClose}>Delete</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  },
  play: async ({ canvas, args }) => {
    const user = userEvent.setup()
    await user.click(canvas.getByText('Open Modal'))
    const cancelButton = canvas.getByText('Cancel')
    await user.click(cancelButton)
    await expect(args.onClose).toHaveBeenCalled()
  },
}
