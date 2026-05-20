import { Box, Button } from '@/primitives'
import { useUiStore, type SettingsCategoryId } from '@/stores/ui'

export const SETTINGS_CATEGORIES: { id: SettingsCategoryId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'connections', label: 'Connections' },
  { id: 'data-display', label: 'Data Display' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'ai', label: 'AI' },
  { id: 'mcp', label: 'MCP Server' },
  { id: 'plugins', label: 'Plugins' },
]

export function SettingsCategoryNav() {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const setActive = useUiStore((s) => s.setActiveSettingsCategory)

  return (
    <Box paddingY="sm">
      {SETTINGS_CATEGORIES.map((cat) => (
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
