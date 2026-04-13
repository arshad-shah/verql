// src/main/plugins/types.ts
import type { PluginStatus, PluginContext } from './sdk/types'

export interface PluginManifest {
  name: string
  version: string
  displayName: string
  description: string
  main: string
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
}

export interface PanelContributionManifest {
  id: string
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
}

export interface SettingContribution {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean'
  default?: string | number | boolean
}

export interface LoadedPlugin {
  manifest: PluginManifest
  path: string
  status: PluginStatus
  module?: { activate: (ctx: PluginContext) => void | Promise<void>; deactivate?: () => void | Promise<void> }
  context?: PluginContext
}
