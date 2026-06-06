// Central catalogue of settings categories — the single source of truth for
// category ids, mirroring how `IPC_CHANNELS` centralises channel names. Every
// place that opens settings at a category, renders the category nav, or maps a
// category to a body component imports from here instead of repeating literals.
import { t } from '@shared/i18n'

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
  { id: SETTINGS_CATEGORY.GENERAL, label: t('settings.nav.general') },
  { id: SETTINGS_CATEGORY.APPEARANCE, label: t('settings.nav.appearance') },
  { id: SETTINGS_CATEGORY.EDITOR, label: t('settings.nav.editor') },
  { id: SETTINGS_CATEGORY.CONNECTIONS, label: t('settings.nav.connections') },
  { id: SETTINGS_CATEGORY.DATA_DISPLAY, label: t('settings.nav.data-display') },
  { id: SETTINGS_CATEGORY.KEYBINDINGS, label: t('settings.nav.keybindings') },
  { id: SETTINGS_CATEGORY.AI, label: t('settings.nav.ai'), ownedBy: 'verql-plugin-ai' },
  { id: SETTINGS_CATEGORY.MCP, label: t('settings.nav.mcp') },
  { id: SETTINGS_CATEGORY.PLUGINS, label: t('settings.nav.plugins') },
]

const CATEGORY_IDS = new Set<string>(Object.values(SETTINGS_CATEGORY))

/** Narrow an arbitrary string (e.g. an AI app-action arg) to a known category. */
export function isSettingsCategory(value: unknown): value is SettingsCategoryId {
  return typeof value === 'string' && CATEGORY_IDS.has(value)
}
