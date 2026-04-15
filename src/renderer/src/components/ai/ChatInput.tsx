import { useState, useCallback, type KeyboardEvent } from 'react'
import { useAIStore } from '@/stores/ai'

export function ChatInput() {
  const [input, setInput] = useState('')
  const sendMessage = useAIStore(s => s.sendMessage)
  const isStreaming = useAIStore(s => s.isStreaming)
  const abort = useAIStore(s => s.abort)

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setInput('')
  }, [input, isStreaming, sendMessage])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex gap-2 p-3 border-t border-[var(--color-border)]">
      <textarea
        className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        placeholder="Ask about your database..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={isStreaming}
      />
      {isStreaming ? (
        <button
          onClick={abort}
          className="self-end rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="self-end rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </div>
  )
}
