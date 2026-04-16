import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ArrowUp, Square, ChevronDown } from 'lucide-react'
import { Card } from '@/primitives/surfaces/Card'
import { IconButton } from '@/primitives/forms/Button'
import { Text } from '@/primitives/typography/Text'
import { Spinner } from '@/primitives/feedback/Spinner'

function ChatInputMock({ hasText = false, isStreaming = false, modelName = 'Claude Sonnet 4.6' }: {
  hasText?: boolean
  isStreaming?: boolean
  modelName?: string
}) {
  return (
    <div className="p-3 border-t border-border-default" style={{ width: 360 }}>
      <Card padding="none" className="overflow-hidden">
        <textarea
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder="Ask about your database... (@ to reference tables)"
          defaultValue={hasText ? 'Show me the schema for the users table' : ''}
          rows={2}
          disabled={isStreaming}
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <button className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-hover transition-colors">
            <Text size="xs" color="accent">{modelName}</Text>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>
          {isStreaming ? (
            <IconButton
              label="Stop generating"
              variant="solid"
              size="xs"
              className="bg-error-emphasis hover:bg-error"
            >
              <Square className="h-3.5 w-3.5" />
            </IconButton>
          ) : (
            <IconButton
              label="Send message"
              variant={hasText ? 'solid' : 'ghost'}
              size="xs"
              disabled={!hasText}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </Card>
    </div>
  )
}

const meta: Meta<typeof ChatInputMock> = {
  title: 'Components/AI/ChatInput',
  component: ChatInputMock,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof ChatInputMock>

export const Empty: Story = {
  args: { hasText: false, isStreaming: false },
}

export const WithText: Story = {
  args: { hasText: true, isStreaming: false },
}

export const Streaming: Story = {
  args: { hasText: false, isStreaming: true },
}

export const DifferentModels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ChatInputMock modelName="Claude Sonnet 4.6" hasText />
      <ChatInputMock modelName="GPT-4o" hasText />
      <ChatInputMock modelName="llama3:latest" hasText />
    </div>
  ),
}

function StreamingIndicatorMock() {
  return (
    <div style={{ width: 360, padding: 16 }} className="flex flex-col gap-6">
      <div>
        <Text size="xs" color="muted" className="mb-2 block">Pre-stream (thinking):</Text>
        <div className="flex items-center gap-2 px-3 py-2">
          <Spinner size="xs" label="Thinking" />
          <Text size="xs" color="muted">Thinking...</Text>
        </div>
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2 block">Mid-stream (cursor):</Text>
        <Card padding="none" className="max-w-[85%] px-3 py-2">
          <Text size="sm">Here are the tables in your database</Text>
          <span className="inline-block w-0.5 h-4 bg-accent animate-[cursor-pulse_1s_ease-in-out_infinite] ml-0.5 align-text-bottom rounded-full" />
        </Card>
      </div>
    </div>
  )
}

export const StreamingIndicator: StoryObj<typeof StreamingIndicatorMock> = {
  render: () => <StreamingIndicatorMock />,
}
