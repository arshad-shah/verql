import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ChatPanelHeader } from './ChatPanelHeader'
import { useAIStore, type Conversation } from '@/stores/ai'
import type { AIChatMessage, AIModelInfo } from '@shared/ai-types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

const models: AIModelInfo[] = [
  { id: 'claude-opus', name: 'Claude Opus', contextWindow: 200_000, capabilities: ['chat', 'tool-calling'] },
]

const msgs = (n: number): AIChatMessage[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `m${i}`,
    timestamp: i,
  }))

const conversations: Conversation[] = [
  { id: 'c1', title: 'Schema overview', messages: [], stats: { totalInputTokens: 0, totalOutputTokens: 0, toolCallCount: 0 }, createdAt: 1, updatedAt: 3 },
  { id: 'c2', title: 'Slow query debugging', messages: [], stats: { totalInputTokens: 0, totalOutputTokens: 0, toolCallCount: 0 }, createdAt: 1, updatedAt: 2 },
]

function seed(patch: { used?: number; messageCount?: number; isCompacting?: boolean }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({
        activeModel: 'claude-opus',
        models,
        conversations,
        activeConversationId: 'c1',
        messages: msgs(patch.messageCount ?? 8),
        isCompacting: patch.isCompacting ?? false,
        sessionStats: {
          totalInputTokens: patch.used ?? 32_000,
          totalOutputTokens: 0,
          toolCallCount: 0,
        },
      })
    }, [])
    return <ChatPanelHeader />
  }
}

const meta: Meta<typeof ChatPanelHeader> = {
  title: 'Components/AI/ChatPanelHeader',
  component: ChatPanelHeader,
  decorators: [
    (Story) => (
      <div style={{ width: 380, background: 'var(--color-bg-primary)' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: seed({}) }
export const ContextNearLimit: Story = { render: seed({ used: 188_000 }) }
export const Compacting: Story = { render: seed({ used: 150_000, isCompacting: true }) }
export const ShortConversation: Story = { render: seed({ messageCount: 2 }) }
