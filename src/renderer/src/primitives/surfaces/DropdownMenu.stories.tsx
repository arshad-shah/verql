import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent, screen } from 'storybook/test'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu } from './DropdownMenu'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/DropdownMenu',
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

const onEditTable = fn()
const onDuplicate = fn()
const onExport = fn()
const onDelete = fn()

export const Default: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="outline">Actions <ChevronDown size={12} className="inline" /></Button>}
      items={[
        { label: 'Edit table', onSelect: onEditTable },
        { label: 'Duplicate', onSelect: onDuplicate },
        { label: 'Export as CSV', onSelect: onExport },
        { label: 'Delete', onSelect: onDelete, disabled: false },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    const user = userEvent.setup()
    await user.click(canvas.getByRole('button', { name: /actions/i }))
    // The menu renders in a FloatingPortal (document.body), so query via screen
    // rather than the story canvas.
    const editItem = await screen.findByText('Edit table')
    await user.click(editItem)
    await expect(onEditTable).toHaveBeenCalled()
  },
}

const onRename = fn()
const onMove = fn()
const onDeleteOption = fn()

export const States: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="outline">Options <ChevronDown size={12} className="inline" /></Button>}
      items={[
        { label: 'Rename', onSelect: onRename },
        { label: 'Move (unavailable)', onSelect: onMove, disabled: true },
        { label: 'Delete', onSelect: onDeleteOption },
      ]}
    />
  ),
}
