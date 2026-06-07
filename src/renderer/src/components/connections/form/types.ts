import type { DatabaseType } from '@shared/types'

/** A connection field contributed by a driver plugin (`plugins:connection-fields`). */
export interface PluginField {
  key: string; label: string; type: string; required?: boolean
  default?: string | number | boolean; group?: string; fetchable?: boolean; step?: number
  options?: { value: string; label: string }[]
  /** Comma-separated extension filter for `file` / `file-path` fields (e.g. `.db,.sqlite`). */
  accept?: string
}

export interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: PluginField[]
}

export interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

/** Progress of the optional "authenticate then fetch options" wizard step. */
export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error'

export const COLOR_PRESETS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

/** The display label for a driver id, e.g. `postgresql` → `Postgresql`. */
export function driverTypeOption(d: PluginDriver): { value: DatabaseType; label: string } {
  return {
    value: d.driverId as DatabaseType,
    label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1)
  }
}

/** Wide fields read better spanning the full width of the 2-column grid. */
export function fieldSpan(field: PluginField): string {
  return field.type === 'select' || field.type === 'file' || field.type === 'file-path' || field.type === 'password'
    ? 'col-span-2'
    : ''
}
