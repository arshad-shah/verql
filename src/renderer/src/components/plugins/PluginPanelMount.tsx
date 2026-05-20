import { useEffect } from 'react'
import { usePluginUIStore } from '@/stores/plugin-ui'
import { ChatPanel } from '@/components/ai/ChatPanel'

/**
 * Mounts host-side React components contributed by plugins.
 *
 * A plugin registers a panel containing a `host-component` widget whose
 * `componentId` maps to a known renderer component (e.g. the AI chat UI).
 * Disabling/uninstalling the plugin removes the contribution and this
 * component renders nothing — the UI disappears with no extra wiring.
 *
 * To add a new host-component, add a case to `RENDERERS` below.
 */
const RENDERERS: Record<string, React.ComponentType> = {
  'ai-chat-panel': ChatPanel
}

interface Props {
  /** Which contribution surface to watch (e.g. 'panels'). */
  surface: 'panels' | 'tabs'
  /** Which host-component id to mount. */
  componentId: string
}

export function PluginPanelMount({ surface, componentId }: Props) {
  const contributions = usePluginUIStore((s) => s.contributions[surface] ?? [])
  const fetchContributions = usePluginUIStore((s) => s.fetchContributions)

  useEffect(() => {
    fetchContributions(surface)
    const off = window.electronAPI.on('plugins:ui:contributions-changed', () => {
      fetchContributions(surface)
    })
    const offLifecycle = window.electronAPI.on('plugins:lifecycle', () => {
      fetchContributions(surface)
    })
    return () => {
      off?.()
      offLifecycle?.()
    }
  }, [surface, fetchContributions])

  const present = contributions.some((c) =>
    c.widgets.some((w) => w.type === 'host-component' && (w as { componentId: string }).componentId === componentId)
  )

  if (!present) return null
  const Comp = RENDERERS[componentId]
  if (!Comp) return null
  return <Comp />
}
