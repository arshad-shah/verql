import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { ToolCallCard } from './ToolCallCard'
import { useAIStore } from '@/stores/ai'
import type { AIChatMessage, AIApprovalRequest } from '@shared/ai-types'

function stubElectronAPI() {
  ;(window as unknown as { electronAPI: unknown }).electronAPI = {
    invoke: async () => undefined,
    on: () => () => {},
  }
}

const callMessage = (overrides?: Partial<AIChatMessage>): AIChatMessage => ({
  id: 'call-1',
  role: 'assistant',
  content: '',
  timestamp: Date.now(),
  toolCalls: [
    {
      id: 'tc-1',
      name: 'execute_query',
      arguments: JSON.stringify({ sql: 'SELECT count(*) FROM users;' }),
    },
  ],
  ...overrides,
})

const resultMessage = (overrides?: Partial<AIChatMessage>): AIChatMessage => ({
  id: 'res-1',
  role: 'tool',
  toolCallId: 'tc-1',
  content: JSON.stringify({ success: true, data: { rowCount: 1284 } }),
  timestamp: Date.now(),
  ...overrides,
})

function seed(patch: { message: AIChatMessage; result?: AIChatMessage; pendingApproval?: AIApprovalRequest | null }) {
  return function StoreSeeder() {
    useEffect(() => {
      stubElectronAPI()
      useAIStore.setState({ pendingApproval: patch.pendingApproval ?? null })
    }, [])
    return <ToolCallCard message={patch.message} result={patch.result} />
  }
}

const meta: Meta<typeof ToolCallCard> = {
  title: 'Components/AI/ToolCallCard',
  component: ToolCallCard,
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

export const Succeeded: Story = {
  render: seed({ message: callMessage(), result: resultMessage() }),
}

export const Failed: Story = {
  render: seed({
    message: callMessage(),
    result: resultMessage({ content: JSON.stringify({ error: 'relation "userz" does not exist' }) }),
  }),
}

export const Executing: Story = {
  render: seed({ message: callMessage() }),
}

export const AwaitingApproval: Story = {
  render: seed({
    message: callMessage({
      toolCalls: [{ id: 'tc-1', name: 'execute_query', arguments: JSON.stringify({ sql: 'DROP TABLE users;' }) }],
    }),
    pendingApproval: {
      requestId: 'req-1',
      toolName: 'execute_query',
      toolDescription: 'Execute a SQL query',
      parameters: { sql: 'DROP TABLE users;' },
      display: 'DROP TABLE users;',
    },
  }),
}

export const SchemaLookup: Story = {
  render: seed({
    message: callMessage({
      toolCalls: [{ id: 'tc-1', name: 'list_tables', arguments: JSON.stringify({ schema: 'public' }) }],
    }),
    result: resultMessage({ content: JSON.stringify({ success: true, data: { rowCount: 12 } }) }),
  }),
}
