import { useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { useUiStore } from '@/stores/ui'
import { MessageThread } from './MessageThread'
import { ActionZone } from './ActionZone'
import { ChatPanelHeader } from './ChatPanelHeader'

export function ChatPanel() {
  const panelOpen = useUiStore(
    s => s.secondarySidebarVisible && s.secondaryActivePanel === 'plugin:ai-chat'
  )
  const loadConfiguredProviders = useAIStore(s => s.loadConfiguredProviders)
  const loadModels = useAIStore(s => s.loadModels)
  const loadPermissionProfile = useAIStore(s => s.loadPermissionProfile)

  useEffect(() => {
    if (panelOpen) {
      loadConfiguredProviders().then(() => loadModels())
      loadPermissionProfile()
    }
  }, [panelOpen, loadConfiguredProviders, loadModels, loadPermissionProfile])

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <ChatPanelHeader />
      <MessageThread />
      <ActionZone />
    </div>
  )
}
