import { useEffect, useState, useCallback } from 'react'
import { Box, Button } from '@/primitives'
import { useUiStore, type SettingsCategoryId } from '@/stores/ui'

interface CategoryDef {
  id: SettingsCategoryId
  label: string
  /** Plugin name that owns this category — if not active, the category is hidden. */
  ownedBy?: string
}

export const SETTINGS_CATEGORIES: CategoryDef[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'connections', label: 'Connections' },
  { id: 'data-display', label: 'Data Display' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'ai', label: 'AI', ownedBy: 'dbstudio-plugin-ai' },
  { id: 'mcp', label: 'MCP Server' },
  { id: 'plugins', label: 'Plugins' },
]

interface PluginInfo {
  name: string
  status: { state: string }
}

interface NavProps {
  /** Optional pre-filtered category list (used by the settings search box). */
  categories?: CategoryDef[]
}

export function SettingsCategoryNav({ categories }: NavProps = {}) {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const setActive = useUiStore((s) => s.setActiveSettingsCategory)
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set())

  const reload = useCallback(async () => {
    try {
      const list = await window.electronAPI.invoke('plugins:list') as PluginInfo[]
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
    const off = window.electronAPI.on('plugins:lifecycle', reload)
    return () => off?.()
  }, [reload])

  // Hide categories whose owning plugin isn't active so disabling/uninstalling
  // a plugin removes its top-level Settings entry without a restart. Then
  // intersect with any caller-supplied filter (the search box) so the same
  // visibility rules apply whether or not search is in play.
  const source = categories ?? SETTINGS_CATEGORIES
  const visible = source.filter((c) => !c.ownedBy || activePlugins.has(c.ownedBy))

  return (
    <Box paddingY="sm">
      {visible.map((cat) => (
        <Button
          key={cat.id}
          variant="ghost"
          size="md"
          onClick={() => setActive(cat.id)}
          className={`w-full justify-start rounded-none px-4 ${
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
