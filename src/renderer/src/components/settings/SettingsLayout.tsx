import { JSX } from 'react'
import { Flex, Box, ScrollArea, Text, Divider } from '@/primitives'
import { useUiStore, type SettingsCategoryId } from '@/stores/ui'
import { SETTINGS_CATEGORIES, SettingsCategoryNav } from './SettingsCategoryNav'
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
 * Settings tab body — a self-contained preferences window with a left-hand
 * category nav and a right-hand content pane. Lives inside the regular tab
 * surface, so the activity sidebar stays focused on the user's data
 * (explorer / saved queries / etc.) while they tweak settings.
 */
export function SettingsLayout() {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const ActiveComponent = categoryComponents[activeCategory] ?? GeneralSettings
  const currentLabel = SETTINGS_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Settings'

  return (
    <Flex direction="row" className="h-full">
      <Box className="w-52 border-r border-border-default shrink-0 bg-bg-secondary">
        <ScrollArea direction="vertical" className="h-full">
          <Box paddingY="md">
            <Text size="xs" color="muted" weight="bold" className="px-4 py-2 uppercase tracking-wider">
              Settings
            </Text>
          </Box>
          <Divider />
          <SettingsCategoryNav />
        </ScrollArea>
      </Box>

      <Flex direction="column" className="flex-1 overflow-hidden">
        <Box className="px-6 py-3 border-b border-border-default">
          <Text size="sm" weight="medium">{currentLabel}</Text>
        </Box>
        <ScrollArea direction="vertical" className="flex-1">
          <Box className="p-6 max-w-3xl">
            <ActiveComponent />
          </Box>
        </ScrollArea>
      </Flex>
    </Flex>
  )
}
