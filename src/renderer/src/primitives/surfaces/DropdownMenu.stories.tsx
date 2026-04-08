import type { Meta, StoryObj } from '@storybook/react'
import { DropdownMenu } from './DropdownMenu'
import { Button } from '../forms/Button'

const meta = {
  title: 'Surfaces/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="outline">Actions ▾</Button>}
      items={[
        { label: 'Edit table', onSelect: () => alert('Edit') },
        { label: 'Duplicate', onSelect: () => alert('Duplicate') },
        { label: 'Export as CSV', onSelect: () => alert('Export') },
        { label: 'Delete', onSelect: () => alert('Delete'), disabled: false },
      ]}
    />
  ),
}

export const WithDisabledItems: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="outline">Options ▾</Button>}
      items={[
        { label: 'Rename', onSelect: () => {} },
        { label: 'Move (unavailable)', onSelect: () => {}, disabled: true },
        { label: 'Delete', onSelect: () => {} },
      ]}
    />
  ),
}
