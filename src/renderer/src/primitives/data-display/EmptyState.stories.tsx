import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'
import { Button } from '../forms/Button'
import { Database } from 'lucide-react'

const meta = {
  title: 'Primitives/Data Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No tables found',
    description: 'Create your first table to get started.',
    icon: <Database size={32} className="text-text-muted" />,
    action: <Button size="sm">Create table</Button>,
  },
}

export const States: Story = {
  args: {
    title: 'No results',
  },
}

export const WithAction: Story = {
  args: {
    title: 'No connections',
    description: 'Connect to a database to explore your data.',
    action: <Button>Add connection</Button>,
  },
}
