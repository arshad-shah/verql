import { JSX, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Flex, Box, ScrollArea, Text, Divider, Input, IconButton } from '@/primitives'
import { useUiStore, type SettingsCategoryId } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { useTabsStore } from '@/stores/tabs'
import { tabActions } from '@/stores/tab-actions'
import { SectionErrorBoundary } from '@/components/shell/SectionErrorBoundary'
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
 * Settings tab body. Follows VS Code's UX for the Settings UI:
 *   - Settings auto-apply as you change them (no draft/save split). This is
 *     what users coming from VS Code expect, and our existing settings store
 *     is already wired this way — every input commits straight through.
 *   - A persistent search input at the top filters the *category list*; the
 *     visible content is whichever category is selected. Filtering across
 *     setting bodies would require a flat content index we don't have yet,
 *     so we filter what we can today (categories) and leave a clear path
 *     forward for full-content search.
 *   - A subtle banner reminds the user that changes save automatically, so
 *     Cmd+S — which the rest of the app uses for explicit saves — doesn't
 *     feel broken here.
 *   - Cmd+S still registers a handler (via tabActions) so the keystroke
 *     produces user feedback ("Settings auto-save" toast) instead of
 *     silently doing nothing.
 */
export function SettingsLayout() {
  const activeCategory = useUiStore((s) => s.activeSettingsCategory)
  const ActiveComponent = categoryComponents[activeCategory] ?? GeneralSettings
  const currentLabel = SETTINGS_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Settings'

  const [query, setQuery] = useState('')

  // Filter category nav by name match — VS Code shows matched categories
  // bolded; we surface filtered list when the user has typed something. When
  // the query is empty we show every category so the panel reads as a normal
  // settings dialog at rest.
  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SETTINGS_CATEGORIES
    return SETTINGS_CATEGORIES.filter(c => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }, [query])

  // Register with the tab-actions registry so the global Cmd+S handler in
  // App.tsx routes through us. Settings already persist eagerly, so save
  // is a no-op — we surface a toast so the user gets feedback instead of
  // wondering if the keystroke was eaten. Mirrors VS Code's behaviour
  // where Cmd+S on the Settings UI is a no-op.
  const activeTabId = useTabsStore(s => s.activeTabId)
  useEffect(() => {
    if (!activeTabId) return
    // Confirm this tab is actually the settings one before claiming the slot.
    const t = useTabsStore.getState().tabs.find(t => t.id === activeTabId)
    if (t?.type !== 'settings') return
    tabActions.register(activeTabId, {
      label: 'Settings',
      // Settings auto-save; nothing to flush. We still register so Cmd+S
      // feels acknowledged and `tabActions.isDirty(id)` returns false
      // (no confirm prompt on close).
      isDirty: () => false,
      onSave: () => {
        useToastStore.getState().addToast({
          type: 'info',
          title: 'Auto-saved',
          message: 'Settings apply immediately — no save required.',
        })
      },
    })
    return () => tabActions.unregister(activeTabId)
  }, [activeTabId])

  return (
    <Flex direction="row" className="h-full">
      {/* Left rail: search + category nav. */}
      <Flex direction="column" className="w-60 border-r border-border-default shrink-0 bg-bg-secondary">
        <Box className="px-3 pt-3 pb-2 border-b border-border-default">
          {/* VS Code-style search: bordered field at the very top of the
              settings surface. We use the existing Input primitive so theme
              + density tokens carry through automatically. */}
          <Flex align="center" gap="xs" className="rounded-md border border-border-default bg-bg-tertiary px-2 py-1 focus-within:border-accent">
            <Search size={12} className="text-text-muted shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search settings"
              size="sm"
              className="flex-1 bg-transparent border-0 focus:ring-0 px-0"
            />
            {query && (
              <IconButton
                label="Clear search"
                size="xs"
                variant="ghost"
                onClick={() => setQuery('')}
                className="shrink-0 -mr-0.5"
              >
                <X size={11} />
              </IconButton>
            )}
          </Flex>
        </Box>
        <ScrollArea direction="vertical" className="flex-1">
          <Box paddingY="sm">
            <Text size="xs" color="muted" weight="bold" className="px-4 py-2 uppercase tracking-wider">
              {query ? `Matches (${filteredCategories.length})` : 'Categories'}
            </Text>
          </Box>
          <Divider />
          <SettingsCategoryNav categories={filteredCategories} />
        </ScrollArea>
      </Flex>

      {/* Right pane: header + auto-save hint + category body. */}
      <Flex direction="column" className="flex-1 overflow-hidden">
        <Box className="px-6 py-3 border-b border-border-default">
          <Flex align="center" justify="between" gap="md">
            <Text size="sm" weight="medium">{currentLabel}</Text>
            {/* VS Code shows a "User / Workspace" breadcrumb here; we have a
                single scope today, so we just confirm the auto-save behaviour
                instead — keeps users from looking for a save button. */}
            <Text size="xs" color="muted" className="italic">
              Changes save automatically
            </Text>
          </Flex>
        </Box>
        <ScrollArea direction="vertical" className="flex-1">
          {/* Fluid up to ~1280px, then centred so a 4K display doesn't put the
              label on one coast and the control on the other. Padding scales
              with breakpoint so the body breathes when the user widens the
              tab. */}
          <Box className="w-full max-w-[1280px] mx-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            <SectionErrorBoundary label={`${currentLabel} settings`} resetKey={activeCategory}>
              <ActiveComponent />
            </SectionErrorBoundary>
          </Box>
        </ScrollArea>
      </Flex>
    </Flex>
  )
}
