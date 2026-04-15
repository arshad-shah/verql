import { useRef, useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { MessageBubble } from './MessageBubble'
import { ToolCallCard } from './ToolCallCard'
import { ApprovalCard } from './ApprovalCard'

export function MessageThread() {
  const messages = useAIStore(s => s.messages)
  const streamingContent = useAIStore(s => s.streamingContent)
  const isStreaming = useAIStore(s => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
          Ask me anything about your database
        </div>
      )}
      {messages.map(msg =>
        msg.toolCalls?.length ? (
          <ToolCallCard key={msg.id} message={msg} />
        ) : msg.role === 'tool' ? (
          <div key={msg.id} className="mb-3 mx-2">
            <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-inset)] rounded p-2">
              {msg.content}
            </div>
          </div>
        ) : (
          <MessageBubble key={msg.id} message={msg} />
        )
      )}
      {streamingContent && (
        <div className="flex justify-start mb-3">
          <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text)] whitespace-pre-wrap">
            {streamingContent}
            <span className="inline-block w-1.5 h-4 bg-[var(--color-accent)] animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}
      <ApprovalCard />
      <div ref={bottomRef} />
    </div>
  )
}
