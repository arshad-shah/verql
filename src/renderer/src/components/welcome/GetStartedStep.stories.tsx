import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Database } from 'lucide-react'
import { GetStartedStep } from './GetStartedStep'

const onAction = fn()

const meta = {
  title: 'Components/Welcome/GetStartedStep',
  component: GetStartedStep,
  decorators: [(Story) => <div style={{ width: 560 }}><Story /></div>],
  args: {
    icon: Database,
    title: 'Create your first connection',
    description: 'Add a database connection so you can browse schema and run queries.',
    actionLabel: 'Add connection',
    doneLabel: 'Done',
    done: false,
    onAction,
  },
} satisfies Meta<typeof GetStartedStep>

export default meta
type Story = StoryObj<typeof meta>

export const Todo: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Create your first connection')).toBeInTheDocument()
    const button = canvas.getByRole('button', { name: 'Add connection' })
    await userEvent.click(button)
    await expect(onAction).toHaveBeenCalledOnce()
  },
}

export const Done: Story = {
  args: { done: true },
  play: async ({ canvas }) => {
    // Completed steps swap the action button for a "Done" badge.
    await expect(canvas.queryByRole('button')).toBeNull()
    await expect(canvas.getByText('Done')).toBeInTheDocument()
  },
}
