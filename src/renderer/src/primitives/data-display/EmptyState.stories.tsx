import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'
import { Button } from '../forms/Button'

const meta = {
  title: 'Data Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    title: 'No tables found',
    description: 'Create your first table to get started.',
    icon: <span style={{ fontSize: 32 }}>🗄️</span>,
    action: <Button size="sm">Create table</Button>,
  },
}

export const Minimal: Story = {
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
