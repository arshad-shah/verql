import { useState } from 'react'
import type { AIChatMessage } from '@shared/ai-types'

interface ToolCallCardProps {
  message: AIChatMessage
}

export function ToolCallCard({ message }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const toolCall = message.toolCalls?.[0]
  if (!toolCall) return null

  return (
    <div className="mb-3 mx-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        <span>Tool: {toolCall.name}</span>
      </button>
      {expanded && (
        <pre className="mt-1 ml-4 p-2 rounded bg-[var(--color-bg-inset)] text-xs overflow-auto max-h-40">
          {toolCall.arguments}
        </pre>
      )}
    </div>
  )
}
