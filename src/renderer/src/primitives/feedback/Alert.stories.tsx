import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'

const meta = {
  title: 'Feedback/Alert',
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

export const Playground: Story = {
  args: {
    variant: 'info',
    title: 'Heads up',
    children: 'You can change your settings in the preferences panel.',
  },
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
}

export const AllVariants: Story = {
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
