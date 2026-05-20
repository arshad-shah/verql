import { Sparkles } from 'lucide-react'
import { Tooltip, IconButton, cn } from '@/primitives'
import { useAIStore } from '@/stores/ai'

/**
 * The "open AI chat" button that lives at the bottom of the ActivityBar.
 * Owned by the AI plugin and mounted via PluginSlot — disabling the
 * plugin removes the button without the host needing to know.
 */
export function AIToggleButton() {
  const toggle = useAIStore((s) => s.togglePanel)
  const open = useAIStore((s) => s.panelOpen)

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
