import { useRef, useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { ScrollArea } from '@/primitives/layout/ScrollArea'
import { Spinner } from '@/primitives/feedback/Spinner'
import { Text } from '@/primitives/typography/Text'
import { Card } from '@/primitives/surfaces/Card'
import { MessageBubble } from './MessageBubble'
import { ToolCallCard } from './ToolCallCard'
import { ApprovalCard } from './ApprovalCard'
import { MarkdownContent } from './MarkdownContent'

export function MessageThread() {
  const messages = useAIStore(s => s.messages)
  const streamingContent = useAIStore(s => s.streamingContent)
  const isStreaming = useAIStore(s => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <ScrollArea direction="vertical" className="flex-1 p-3">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full">
          <Text size="sm" color="secondary">Ask me anything about your database</Text>
        </div>
      )}
      {messages.map(msg =>
        msg.toolCalls?.length ? (
          <ToolCallCard key={msg.id} message={msg} />
        ) : msg.role === 'tool' ? (
          <div key={msg.id} className="mb-3 mx-2">
            <Card padding="sm" className="bg-bg-tertiary">
              <Text size="xs" color="secondary">{msg.content}</Text>
            </Card>
          </div>
        ) : (
          <MessageBubble key={msg.id} message={msg} />
        )
      )}
      {isStreaming && !streamingContent && (
        <div className="flex justify-start mb-3">
          <div className="flex items-center gap-2 px-3 py-2">
            <Spinner size="xs" label="Thinking" />
            <Text size="xs" color="muted">Thinking...</Text>
          </div>
        </div>
      )}
      {streamingContent && (
        <div className="flex justify-start mb-3">
          <Card padding="none" className="max-w-[85%] px-3 py-2">
            <MarkdownContent content={streamingContent} />
            <span className="inline-block w-0.5 h-4 bg-accent animate-[cursor-pulse_1s_ease-in-out_infinite] ml-0.5 align-text-bottom rounded-full" />
          </Card>
        </div>
      )}
      <ApprovalCard />
      <div ref={bottomRef} />
    </ScrollArea>
  )
}
