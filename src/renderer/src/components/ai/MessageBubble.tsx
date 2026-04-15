import type { AIChatMessage } from '@shared/ai-types'

interface MessageBubbleProps {
  message: AIChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.role === 'assistant' && message.content.startsWith('Error:')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--color-accent)] text-white'
            : isError
              ? 'bg-red-900/30 text-red-300 border border-red-800'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text)]'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
