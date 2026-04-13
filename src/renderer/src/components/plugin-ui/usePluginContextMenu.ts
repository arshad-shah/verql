import { useEffect } from 'react'
import { usePluginUIStore } from '@/stores/plugin-ui'
import type { ContextMenuTarget } from '@shared/plugin-ui-types'

export function usePluginContextMenuItems(target: ContextMenuTarget) {
  const contributions = usePluginUIStore((s) => s.contributions.contextMenu ?? [])
  const fetchContributions = usePluginUIStore((s) => s.fetchContributions)
  const executeAction = usePluginUIStore((s) => s.executeAction)

  useEffect(() => {
    fetchContributions('contextMenu')
  }, [fetchContributions])

  const items = contributions
    .filter((c) => c.meta.target === target)
    .map((c) => ({
      label: `${c.pluginName}: ${c.meta.label}`,
      onSelect: () => executeAction(c.pluginId, c.meta.command as string, {}),
    }))

  return items
}
