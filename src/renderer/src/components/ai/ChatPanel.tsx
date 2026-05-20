import { useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { useUiStore } from '@/stores/ui'
import { MessageThread } from './MessageThread'
import { ChatInput } from './ChatInput'
import { SessionInfo } from './SessionInfo'

export function ChatPanel() {
  const panelOpen = useUiStore(
    s => s.secondarySidebarVisible && s.secondaryActivePanel === 'plugin:ai-chat'
  )
  const loadConfiguredProviders = useAIStore(s => s.loadConfiguredProviders)
  const loadModels = useAIStore(s => s.loadModels)

  useEffect(() => {
    if (panelOpen) {
      loadConfiguredProviders().then(() => loadModels())
    }
  }, [panelOpen, loadConfiguredProviders, loadModels])

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <SessionInfo />
      <MessageThread />
      <ChatInput />
    </div>
  )
}
