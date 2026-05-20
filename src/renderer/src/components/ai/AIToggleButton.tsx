import { Sparkles } from 'lucide-react'
import { Tooltip, IconButton, cn } from '@/primitives'
import { useAIStore } from '@/stores/ai'
import { useUiStore } from '@/stores/ui'

/**
 * The "open AI chat" button that lives at the bottom of the ActivityBar.
 * Owned by the AI plugin and mounted via PluginSlot — disabling the
 * plugin removes the button without the host needing to know.
 */
export function AIToggleButton() {
  const toggle = useAIStore((s) => s.togglePanel)
  const open = useUiStore(
    (s) => s.secondarySidebarVisible && s.secondaryActivePanel === 'plugin:ai-chat'
  )

  return (
    <Tooltip content="AI Assistant" side="right">
      <IconButton
        label="AI Assistant"
        size="lg"
        variant="ghost"
        onClick={toggle}
        className={cn(
          'rounded-lg transition-colors',
          open
            ? 'bg-accent/10 text-accent hover:bg-accent/10'
            : 'text-text-muted hover:text-text-primary hover:bg-white/5'
        )}
      >
        <Sparkles size={20} />
      </IconButton>
    </Tooltip>
  )
}
