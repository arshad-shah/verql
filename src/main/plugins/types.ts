// src/main/plugins/types.ts
import type { PluginStatus, PluginContext } from './sdk/types'
import type { ActivityBarContribution, StatusBarContribution, ContextMenuContribution, TabContribution, SelectorContribution } from '@shared/plugin-ui-types'

export interface PluginManifest {
  name: string
  version: string
  displayName: string
  description: string
  main: string
  icon?: string
  contributes: {
    drivers?: DriverContribution[]
    themes?: ThemeContribution[]
    commands?: CommandContribution[]
    exporters?: ExporterContribution[]
    importers?: ImporterContribution[]
    connectionMiddleware?: { id: string }[]
    connectionFields?: ConnectionFieldContribution[]
    panels?: PanelContributionManifest[]
    settings?: SettingContribution[]
    activityBar?: ActivityBarContribution[]
    statusBar?: StatusBarContribution[]
    toolbar?: StatusBarContribution[]
    contextMenus?: ContextMenuContribution[]
    tabs?: TabContribution[]
    selectors?: SelectorContribution[]
  }
}

export interface DriverContribution {
  id: string
  name: string
  icon?: string
}

export interface ThemeContribution {
  id: string
  name: string
  type: 'dark' | 'light'
}

export interface CommandContribution {
  id: string
  title: string
  keybinding?: string
}

export interface ExporterContribution {
  id: string
  name: string
  extension: string
}

export interface ImporterContribution {
  id: string
  name: string
  extensions: string[]
}

export interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean
  step?: number
}

export interface PanelContributionManifest {
  id: string
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
}

/**
 * Top-level Settings categories the host knows about. A plugin can target one
 * (or 'plugin' for its own detail panel only). When set, the setting renders
 * both in the plugin's own panel and in the matching core category — when the
 * plugin is disabled or uninstalled, it disappears from both places.
 */
export type SettingCategoryTarget =
  | 'general' | 'appearance' | 'editor' | 'connections'
  | 'data-display' | 'keybindings' | 'ai' | 'mcp' | 'plugin'

export interface SettingContribution {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'select'
  default?: string | number | boolean
  /** Plain-English helper text rendered below the title. */
  description?: string
  /** For `type: 'number'` only. */
  min?: number
  max?: number
  step?: number
  /** For `type: 'select'` only. */
  options?: { value: string; label: string }[]
  /**
   * Where this setting should appear. Defaults to 'plugin' (only inside the
   * plugin's own detail panel). Set to a core category id to also surface it
   * in that category.
   */
  category?: SettingCategoryTarget
}

export interface LoadedPlugin {
  manifest: PluginManifest
  path: string
  status: PluginStatus
  module?: { activate: (ctx: PluginContext) => void | Promise<void>; deactivate?: () => void | Promise<void> }
  context?: PluginContext
}
