import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { EmptyState } from './EmptyState'
import { Button } from '../forms/Button'
import { Database } from 'lucide-react'

const onAction = fn()

const meta = {
  title: 'Primitives/Data Display/EmptyState',
  component: EmptyState,
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
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
    action: <Button size="sm" onClick={onAction}>Create table</Button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No tables found')).toBeInTheDocument()
    await expect(canvas.getByText('Create your first table to get started.')).toBeInTheDocument()
    const button = canvas.getByRole('button', { name: 'Create table' })
    await userEvent.click(button)
    await expect(onAction).toHaveBeenCalledOnce()
  },
}

export const States: Story = {
  args: {
    title: 'No results',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No results')).toBeInTheDocument()
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} style={{ border: '1px solid var(--color-border-default)', borderRadius: 8 }}>
          <EmptyState
            size={size}
            title={`Size: ${size}`}
            description="Vertical density follows the size prop."
            icon={<Database size={32} className="text-text-muted" />}
          />
        </div>
      ))}
    </div>
  ),
}

export const WithAction: Story = {
  args: {
    title: 'No connections',
    description: 'Connect to a database to explore your data.',
    action: <Button>Add connection</Button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No connections')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Add connection' })).toBeInTheDocument()
  },
}
