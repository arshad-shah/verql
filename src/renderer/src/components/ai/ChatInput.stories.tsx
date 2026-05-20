import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ChatInput } from './ChatInput'
import { useAIStore } from '@/stores/ai'

/**
 * Renders the real `ChatInput`. Because it reads from `useAIStore` we
 * pre-seed the store in a per-story decorator — same pattern as
 * `ActiveConnectionsPanel.stories.tsx`. No replica components.
 */
function seedAI(opts: { isStreaming?: boolean; activeModel?: string; modelName?: string } = {}) {
  const { isStreaming = false, activeModel = 'claude-sonnet-4-6', modelName = 'Claude Sonnet 4.6' } = opts
  useAIStore.setState({
    isStreaming,
    activeModel,
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'anthropic', contextWindow: 1_000_000 },
      { id: 'gpt-4o',            name: 'GPT-4o',            providerId: 'openai',    contextWindow: 128_000 },
      { id: 'llama3:latest',     name: 'llama3:latest',     providerId: 'ollama',    contextWindow: 8_192 },
    ],
    providers: [
      { id: 'anthropic', name: 'Anthropic', configured: true },
      { id: 'openai',    name: 'OpenAI',    configured: true },
      { id: 'ollama',    name: 'Ollama',    configured: true },
    ],
    // Render-only states never invoke this, but the store typings need a value.
    sendMessage: async () => {},
    abort: async () => {},
  } as Partial<ReturnType<typeof useAIStore.getState>>)
}

const meta: Meta<typeof ChatInput> = {
  title: 'Components/AI/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-90 border border-border-default rounded-md bg-bg-secondary">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof ChatInput>

export const Empty: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seedAI() }, [])
      return <Story />
    },
  ],
}

export const Streaming: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seedAI({ isStreaming: true }) }, [])
      return <Story />
    },
  ],
}

export const ModelGpt: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seedAI({ activeModel: 'gpt-4o' }) }, [])
      return <Story />
    },
  ],
}

export const ModelOllama: Story = {
  decorators: [
    (Story) => {
      useEffect(() => { seedAI({ activeModel: 'llama3:latest' }) }, [])
      return <Story />
    },
  ],
}
