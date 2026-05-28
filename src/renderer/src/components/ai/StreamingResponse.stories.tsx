import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { StreamingResponse } from './StreamingResponse'
import { useAIStore } from '@/stores/ai'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(patch: { isAwaitingResponse?: boolean; streamingContent?: string }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({
        isAwaitingResponse: patch.isAwaitingResponse ?? false,
        streamingContent: patch.streamingContent ?? '',
      })
    }, [])
    return <StreamingResponse />
  }
}

const meta: Meta<typeof StreamingResponse> = {
  title: 'Components/AI/StreamingResponse',
  component: StreamingResponse,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 380, padding: 16, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Awaiting: Story = { render: seed({ isAwaitingResponse: true }) }
export const Streaming: Story = { render: seed({ streamingContent: 'Looking at the schema… the **orders** table has 8 columns and 3 indexes.' }) }
export const Hidden: Story = { render: seed({}) }
