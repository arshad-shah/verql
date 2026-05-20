import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useAIStore } from '@/stores/ai'
import { Text } from '@/primitives/typography/Text'
import { IconButton } from '@/primitives/forms/Button'
import { MessageThread } from './MessageThread'
import { ChatInput } from './ChatInput'
import { SessionInfo } from './SessionInfo'

export function ChatPanel() {
  const panelOpen = useAIStore(s => s.panelOpen)
  const loadConfiguredProviders = useAIStore(s => s.loadConfiguredProviders)
  const loadModels = useAIStore(s => s.loadModels)
  const clearMessages = useAIStore(s => s.clearMessages)

  useEffect(() => {
    if (panelOpen) {
      loadConfiguredProviders().then(() => loadModels())
    }
  }, [panelOpen, loadConfiguredProviders, loadModels])

  if (!panelOpen) return null

  return (
    <div className="flex flex-col h-full border-l border-border-default bg-bg-primary" style={{ width: 380 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
        <Text size="sm" weight="medium">AI Assistant</Text>
        <IconButton
          label="Clear conversation"
          variant="ghost"
          size="xs"
          onClick={clearMessages}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <SessionInfo />
      <MessageThread />
      <ChatInput />
    </div>
  )
}
