import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Shield } from 'lucide-react'
import { Alert } from './Alert'

const meta = {
  title: 'Primitives/Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning', 'info'],
    },
    title: { control: 'text' },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'info',
    title: 'Heads up',
    children: 'You can change your settings in the preferences panel.',
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 380 }}>
      <Alert variant="default" title="Default">Something happened that you should know about.</Alert>
      <Alert variant="success" title="Success">Query executed — 42 rows returned.</Alert>
      <Alert variant="error" title="Error">Failed to connect: authentication failed.</Alert>
      <Alert variant="warning" title="Warning">This operation will modify 1,234 rows.</Alert>
      <Alert variant="info" title="Info">Indexes will be rebuilt on next startup.</Alert>
    </div>
  ),
}

export const Dismissible: Story = {
  args: {
    variant: 'warning',
    title: 'Unsaved changes',
    children: 'You have unsaved changes that will be lost if you navigate away.',
    onClose: fn(),
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const CustomIcon: Story = {
  args: {
    variant: 'info',
    title: 'Security update',
    children: 'A new security patch is available for your database driver.',
    icon: <Shield size={16} className="mt-0.5 shrink-0" />,
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const NoIcon: Story = {
  args: {
    variant: 'success',
    title: 'Done',
    children: 'All migrations completed successfully.',
    icon: null,
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const TitleOnly: Story = {
  args: {
    variant: 'error',
    title: 'Connection lost',
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const DescriptionOnly: Story = {
  args: {
    variant: 'info',
    children: 'Indexes will be rebuilt on next startup.',
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}
