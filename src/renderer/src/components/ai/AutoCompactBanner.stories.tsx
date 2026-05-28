import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { AutoCompactBanner } from './AutoCompactBanner'
import { useAIStore } from '@/stores/ai'
import type { AIChatMessage } from '@shared/ai-types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

const msgs = (n: number): AIChatMessage[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `m${i}`,
    timestamp: 0,
  }))

function seed(patch: {
  used: number
  contextWindow: number
  isCompacting?: boolean
  suppressed?: boolean
  lastSnapshot?: AIChatMessage[] | null
  messageCount?: number
}) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({
        activeModel: 'demo',
        models: [{ id: 'demo', name: 'demo', contextWindow: patch.contextWindow, inputCost: 0, outputCost: 0 }] as unknown as Parameters<typeof useAIStore.setState>[0]['models'],
        sessionStats: { totalInputTokens: patch.used, totalOutputTokens: 0, toolCallCount: 0 },
        messages: msgs(patch.messageCount ?? 8),
        isStreaming: false,
        isAwaitingResponse: false,
        isCompacting: patch.isCompacting ?? false,
        activeConversationId: 'c1',
        autoCompactSuppressed: patch.suppressed ? { c1: true } : {},
        lastPreCompactMessages: patch.lastSnapshot ?? null,
      })
    }, [])
    return <AutoCompactBanner />
  }
}

const meta: Meta<typeof AutoCompactBanner> = {
  title: 'Components/AI/AutoCompactBanner',
  component: AutoCompactBanner,
  tags: ['autodocs'],
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

export const Idle: Story = { render: seed({ used: 30_000, contextWindow: 200_000 }) }
export const Pending: Story = { render: seed({ used: 164_000, contextWindow: 200_000 }) }
export const Compacting: Story = { render: seed({ used: 164_000, contextWindow: 200_000, isCompacting: true }) }
export const SuccessWithUndo: Story = {
  render: seed({
    used: 30_000,
    contextWindow: 200_000,
    lastSnapshot: msgs(8),
  }),
}
export const Forced: Story = { render: seed({ used: 192_000, contextWindow: 200_000 }) }
