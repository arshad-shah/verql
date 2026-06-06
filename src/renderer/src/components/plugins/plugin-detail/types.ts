// Shared shapes for the plugin-detail tabs (extracted from PluginDetailView).
export interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  icon?: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
  requestedPermissions: string[]
  grantedPermissions: string[]
}

export interface PermissionState {
  trusted: boolean
  declared: string[]
  granted: string[]
  info: Record<string, { title: string; description: string; enforced: boolean; sensitive: boolean }>
}

export interface ErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

export interface SettingSchema {
  key: string
  title: string
  type: string
  default?: string | number | boolean
  description?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
}
