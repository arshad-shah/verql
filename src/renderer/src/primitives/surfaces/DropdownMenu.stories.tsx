import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { DropdownMenu } from './DropdownMenu'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
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
      trigger={<Button variant="outline">Actions ▾</Button>}
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
    await user.click(canvas.getByText('Actions ▾'))
    const editItem = await canvas.findByText('Edit table')
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
      trigger={<Button variant="outline">Options ▾</Button>}
      items={[
        { label: 'Rename', onSelect: onRename },
        { label: 'Move (unavailable)', onSelect: onMove, disabled: true },
        { label: 'Delete', onSelect: onDeleteOption },
      ]}
    />
  ),
}
