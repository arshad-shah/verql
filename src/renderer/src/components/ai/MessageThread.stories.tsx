import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { MessageThread } from './MessageThread'
import { useAIStore } from '@/stores/ai'
import type { AIChatMessage } from '@shared/ai-types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

function seed(patch: { messages?: AIChatMessage[]; isAwaitingResponse?: boolean; streamingContent?: string }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({
        messages: patch.messages ?? [],
        isAwaitingResponse: patch.isAwaitingResponse ?? false,
        streamingContent: patch.streamingContent ?? '',
        pendingApproval: null,
      })
    }, [])
    return <MessageThread />
  }
}

const conversation: AIChatMessage[] = [
  { id: '1', role: 'user', content: 'How many users signed up today?', timestamp: 1 },
  {
    id: '2',
    role: 'assistant',
    content: '',
    timestamp: 2,
    toolCalls: [{ id: 'tc-1', name: 'execute_query', arguments: JSON.stringify({ sql: "SELECT count(*) FROM users WHERE created_at::date = current_date;" }) }],
  },
  { id: '3', role: 'tool', toolCallId: 'tc-1', content: JSON.stringify({ success: true, data: { rowCount: 1 } }), timestamp: 3 },
  { id: '4', role: 'assistant', content: '**1,284** users signed up today.', timestamp: 4 },
]

const meta: Meta<typeof MessageThread> = {
  title: 'Components/AI/MessageThread',
  component: MessageThread,
  decorators: [
    (Story) => (
      <div style={{ width: 380, height: 480, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { render: seed({}) }
export const Conversation: Story = { render: seed({ messages: conversation }) }
export const Awaiting: Story = {
  render: seed({ messages: conversation.slice(0, 1), isAwaitingResponse: true }),
}
export const Streaming: Story = {
  render: seed({
    messages: conversation.slice(0, 1),
    streamingContent: 'Checking the `users` table for signups created today…',
  }),
}
