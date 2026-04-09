import { JSX, useState } from 'react'
import { Flex, Box, ScrollArea, Text, Button, Divider } from '@/primitives'
import { GeneralSettings } from './categories/GeneralSettings'
import { AppearanceSettings } from './categories/AppearanceSettings'
import { EditorSettings } from './categories/EditorSettings'
import { ConnectionSettings } from './categories/ConnectionSettings'
import { DataDisplaySettings } from './categories/DataDisplaySettings'
import { KeybindingsSettings } from './categories/KeybindingsSettings'
import { PluginSettings } from './categories/PluginSettings'

const categories = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'connections', label: 'Connections' },
  { id: 'data-display', label: 'Data Display' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'plugins', label: 'Plugins' },
] as const

type CategoryId = (typeof categories)[number]['id']

const categoryComponents: Record<CategoryId, () => JSX.Element> = {
  general: GeneralSettings,
  appearance: AppearanceSettings,
  editor: EditorSettings,
  connections: ConnectionSettings,
  'data-display': DataDisplaySettings,
  keybindings: KeybindingsSettings,
  plugins: PluginSettings,
}

export function SettingsLayout() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general')
  const ActiveComponent = categoryComponents[activeCategory]

  return (
    <Flex direction="row" className="h-full">
      <Box className="w-48 border-r border-border-default shrink-0">
        <ScrollArea direction="vertical" className="h-full">
          <Box paddingY='sm'>
            <Box paddingY='md'>
              <Text size="sm" color="muted" weight={'bold'} className="px-4 py-2 uppercase tracking-wider">
                Settings
              </Text>
            </Box>

            <Divider />
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="md"
                onClick={() => setActiveCategory(cat.id)}
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
        </ScrollArea>
      </Box>

      <ScrollArea direction="vertical" className="flex-1">
        <Box className="p-6 max-w-2xl">
          <ActiveComponent />
        </Box>
      </ScrollArea>
    </Flex>
  )
}
