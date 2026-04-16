import type { AIChatMessage } from '@shared/ai-types'
import { Card } from '@/primitives/surfaces/Card'
import { Text } from '@/primitives/typography/Text'
import { MarkdownContent } from './MarkdownContent'

interface MessageBubbleProps {
  message: AIChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.role === 'assistant' && message.content.startsWith('Error:')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[85%]">
        {isUser ? (
          <Card padding="none" className="bg-accent-emphasis border-accent-emphasis px-3 py-2">
            <Text size="sm" className="text-white whitespace-pre-wrap">{message.content}</Text>
          </Card>
        ) : isError ? (
          <Card padding="none" className="bg-error/10 border-error/30 px-3 py-2">
            <Text size="sm" color="error" className="whitespace-pre-wrap">{message.content}</Text>
          </Card>
        ) : (
          <Card padding="none" className="px-3 py-2">
            <MarkdownContent content={message.content} />
          </Card>
        )}
      </div>
    </div>
  )
}
