import { JSX } from 'react'
import { Box, ScrollArea } from '@/primitives'
import { useUiStore, type SettingsCategoryId } from '@/stores/ui'
import { GeneralSettings } from './categories/GeneralSettings'
import { AppearanceSettings } from './categories/AppearanceSettings'
import { EditorSettings } from './categories/EditorSettings'
import { ConnectionSettings } from './categories/ConnectionSettings'
import { DataDisplaySettings } from './categories/DataDisplaySettings'
import { KeybindingsSettings } from './categories/KeybindingsSettings'
import { PluginSettings } from './categories/PluginSettings'
import { AISettings } from './categories/AISettings'
import { MCPSettings } from './categories/MCPSettings'

const categoryComponents: Record<SettingsCategoryId, () => JSX.Element> = {
  general: GeneralSettings,
  appearance: AppearanceSettings,
  editor: EditorSettings,
  connections: ConnectionSettings,
  'data-display': DataDisplaySettings,
  keybindings: KeybindingsSettings,
  ai: AISettings,
  mcp: MCPSettings,
  plugins: PluginSettings,
}

/**
 * Settings content surface. The category nav lives in the regular sidebar
 * (see SettingsCategoryNav, mounted by Sidebar when activePanel === 'settings')
 * so the layout matches every other activity panel.
 */
export function SettingsLayout() {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const ActiveComponent = categoryComponents[activeCategory] ?? GeneralSettings

  return (
    <ScrollArea direction="vertical" className="flex-1">
      <Box className="p-6 max-w-2xl">
        <ActiveComponent />
      </Box>
    </ScrollArea>
  )
}
