// Central catalogue of settings categories — the single source of truth for
// category ids, mirroring how `IPC_CHANNELS` centralises channel names. Every
// place that opens settings at a category, renders the category nav, or maps a
// category to a body component imports from here instead of repeating literals.

export const SETTINGS_CATEGORY = {
  GENERAL: 'general',
  APPEARANCE: 'appearance',
  EDITOR: 'editor',
  CONNECTIONS: 'connections',
  DATA_DISPLAY: 'data-display',
  KEYBINDINGS: 'keybindings',
  AI: 'ai',
  MCP: 'mcp',
  PLUGINS: 'plugins',
} as const

export type SettingsCategoryId = (typeof SETTINGS_CATEGORY)[keyof typeof SETTINGS_CATEGORY]

export interface SettingsCategoryDef {
  id: SettingsCategoryId
  label: string
  /** Plugin name that owns this category — if not active, the category is hidden. */
  ownedBy?: string
}

/** Ordered catalogue rendered by the settings category nav. */
export const SETTINGS_CATEGORIES: SettingsCategoryDef[] = [
  { id: SETTINGS_CATEGORY.GENERAL, label: 'General' },
  { id: SETTINGS_CATEGORY.APPEARANCE, label: 'Appearance' },
  { id: SETTINGS_CATEGORY.EDITOR, label: 'Editor' },
  { id: SETTINGS_CATEGORY.CONNECTIONS, label: 'Connections' },
  { id: SETTINGS_CATEGORY.DATA_DISPLAY, label: 'Data Display' },
  { id: SETTINGS_CATEGORY.KEYBINDINGS, label: 'Keybindings' },
  { id: SETTINGS_CATEGORY.AI, label: 'AI', ownedBy: 'verql-plugin-ai' },
  { id: SETTINGS_CATEGORY.MCP, label: 'MCP Server' },
  { id: SETTINGS_CATEGORY.PLUGINS, label: 'Plugins' },
]

const CATEGORY_IDS = new Set<string>(Object.values(SETTINGS_CATEGORY))

/** Narrow an arbitrary string (e.g. an AI app-action arg) to a known category. */
export function isSettingsCategory(value: unknown): value is SettingsCategoryId {
  return typeof value === 'string' && CATEGORY_IDS.has(value)
}
