import { useEffect, useState, useCallback } from 'react'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Button } from '@arshad-shah/cynosure-react/button'
import { useUiStore } from '@/stores/ui'
import { SETTINGS_CATEGORIES, type SettingsCategoryDef } from '@/lib/settings-categories'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'

// Re-export so existing importers (e.g. SettingsLayout) keep working.
export { SETTINGS_CATEGORIES }

interface PluginInfo {
  name: string
  status: { state: string }
}

interface NavProps {
  /** Optional pre-filtered category list (used by the settings search box). */
  categories?: SettingsCategoryDef[]
}

export function SettingsCategoryNav({ categories }: NavProps = {}) {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const setActive = useUiStore((s) => s.setActiveSettingsCategory)
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set())

  const reload = useCallback(async () => {
    try {
      const list = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST) as PluginInfo[]
      const active = new Set(
        list.filter((p) => p.status.state === 'active' || p.status.state === 'degraded').map((p) => p.name)
      )
      setActivePlugins(active)
    } catch {
      setActivePlugins(new Set())
    }
  }, [])

  useEffect(() => {
    reload()
    const off = window.electronAPI.on(IPC_EVENTS.PLUGINS_LIFECYCLE, reload)
    return () => off?.()
  }, [reload])

  // Hide categories whose owning plugin isn't active so disabling/uninstalling
  // a plugin removes its top-level Settings entry without a restart. Then
  // intersect with any caller-supplied filter (the search box) so the same
  // visibility rules apply whether or not search is in play.
  const source = categories ?? SETTINGS_CATEGORIES
  const visible = source.filter((c) => !c.ownedBy || activePlugins.has(c.ownedBy))

  return (
    <Box paddingY="2">
      {visible.map((cat) => (
        <Button
          key={cat.id}
          variant="ghost"
          colorScheme="neutral"
          size="md"
          fullWidth
          onClick={() => setActive(cat.id)}
          className={`justify-start rounded-none px-4 ${
            activeCategory === cat.id
              ? 'bg-hover border-l-2 border-l-accent text-text-primary'
              : 'border-l-2 border-l-transparent text-text-secondary'
          }`}
        >
          {cat.label}
        </Button>
      ))}
    </Box>
  )
}
