import { useRef, useEffect, useMemo } from 'react'
import { useAIStore } from '@/stores/ai'
import { ScrollArea } from '@/primitives/layout/ScrollArea'
import { Spinner } from '@/primitives/feedback/Spinner'
import { Text } from '@/primitives/typography/Text'
import { Card } from '@/primitives/surfaces/Card'
import { MessageBubble } from './MessageBubble'
import { ToolCallCard } from './ToolCallCard'
import { ApprovalCard } from './ApprovalCard'
import { MarkdownContent } from './MarkdownContent'
import type { AIChatMessage } from '@shared/ai-types'

export function MessageThread() {
  const messages = useAIStore(s => s.messages)
  const streamingContent = useAIStore(s => s.streamingContent)
  const isStreaming = useAIStore(s => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Build a map of toolCallId → result message, and a set of result message IDs to skip
  const { resultMap, resultIds } = useMemo(() => {
    const rMap = new Map<string, AIChatMessage>()
    const rIds = new Set<string>()
    for (const msg of messages) {
      if (msg.role === 'tool' && msg.toolCallId) {
        rMap.set(msg.toolCallId, msg)
        rIds.add(msg.id)
      }
    }
    return { resultMap: rMap, resultIds: rIds }
  }, [messages])

  return (
    <ScrollArea direction="vertical" className="flex-1 p-3">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full">
          <Text size="sm" color="secondary">Ask me anything about your database</Text>
        </div>
      )}
      {messages.map(msg => {
        // Skip standalone tool-result messages — they're shown inside ToolCallCard
        if (resultIds.has(msg.id)) return null

        if (msg.toolCalls?.length) {
          const toolCallId = msg.toolCalls[0].id
          const result = resultMap.get(toolCallId)
          return <ToolCallCard key={msg.id} message={msg} result={result} />
        }

        return <MessageBubble key={msg.id} message={msg} />
      })}
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
