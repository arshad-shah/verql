import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ToastContainer } from './ToastContainer'
import { useToastStore, type Toast } from '@/stores/toast'

function seed(toasts: Toast[]) {
  useToastStore.setState({ toasts })
}

const meta: Meta<typeof ToastContainer> = {
  title: 'Components/Shell/ToastContainer',
  component: ToastContainer,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

/** A single success toast. */
export const Success: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed([{ id: '1', type: 'success', title: 'Query executed', message: '128 rows in 42ms' }]) }, [])
      return <Story />
    },
  ],
}

/** An error toast with a longer message. */
export const Error: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seed([{ id: '1', type: 'error', title: 'Connection failed', message: 'could not connect to server: Connection refused' }])
      }, [])
      return <Story />
    },
  ],
}

/** A persistent info toast (spinner icon, stays until dismissed). */
export const PersistentInfo: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seed([{ id: '1', type: 'info', title: 'Exporting…', message: 'Writing rows to CSV', persistent: true }]) }, [])
      return <Story />
    },
  ],
}

/** Several stacked toasts of mixed types. */
export const Stacked: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        seed([
          { id: '1', type: 'success', title: 'Saved query' },
          { id: '2', type: 'info', title: 'Schema refreshed' },
          { id: '3', type: 'error', title: 'Migration failed', message: 'relation "users" already exists' },
        ])
      }, [])
      return <Story />
    },
  ],
}
