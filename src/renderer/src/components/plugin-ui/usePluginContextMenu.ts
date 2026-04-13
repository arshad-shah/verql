import { useEffect } from 'react'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import type { ContextMenuTarget } from '@shared/plugin-ui-types'

export function usePluginContextMenuItems(target: ContextMenuTarget) {
  const contributions = usePluginUIStore(selectContributions('contextMenu'))
  const executeAction = usePluginUIStore((s) => s.executeAction)

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('contextMenu')
  }, [])

  const items = contributions
    .filter((c) => c.meta.target === target)
    .map((c) => ({
      label: `${c.pluginName}: ${c.meta.label}`,
      onSelect: () => executeAction(c.pluginId, c.meta.command as string, {}),
    }))

  return items
}
