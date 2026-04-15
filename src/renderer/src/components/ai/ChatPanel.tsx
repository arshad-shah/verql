import { useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { MessageThread } from './MessageThread'
import { ChatInput } from './ChatInput'

export function ChatPanel() {
  const panelOpen = useAIStore(s => s.panelOpen)
  const activeProvider = useAIStore(s => s.activeProvider)
  const activeModel = useAIStore(s => s.activeModel)
  const providers = useAIStore(s => s.providers)
  const models = useAIStore(s => s.models)
  const loadProviders = useAIStore(s => s.loadProviders)
  const loadModels = useAIStore(s => s.loadModels)
  const setActiveProvider = useAIStore(s => s.setActiveProvider)
  const setActiveModel = useAIStore(s => s.setActiveModel)
  const clearMessages = useAIStore(s => s.clearMessages)

  useEffect(() => {
    if (panelOpen) {
      loadProviders()
      loadModels()
    }
  }, [panelOpen, loadProviders, loadModels])

  if (!panelOpen) return null

  return (
    <div className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-bg)]" style={{ width: 380 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <span className="text-sm font-medium text-[var(--color-text)]">AI Assistant</span>
        <button
          onClick={clearMessages}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 px-3 py-2 border-b border-[var(--color-border)]">
        <select
          value={activeProvider?.id ?? ''}
          onChange={e => setActiveProvider(e.target.value)}
          className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select provider</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={activeModel ?? ''}
          onChange={e => setActiveModel(e.target.value)}
          className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select model</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <MessageThread />
      <ChatInput />
    </div>
  )
}
