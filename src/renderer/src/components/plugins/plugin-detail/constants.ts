import { CheckCircle, AlertTriangle, XCircle, PowerOff, Clock } from 'lucide-react'
import type { MessageKey } from '@shared/i18n'

export interface StateConfig {
  labelKey: MessageKey
  /** Cynosure Badge colorScheme for the plugin-state badge. */
  variant: 'success' | 'warning' | 'danger' | 'neutral'
  icon: typeof CheckCircle
}

export const STATE_CONFIG: Record<string, StateConfig> = {
  active: { labelKey: 'plugins.detail.state.active', variant: 'success', icon: CheckCircle },
  degraded: { labelKey: 'plugins.detail.state.degraded', variant: 'warning', icon: AlertTriangle },
  error: { labelKey: 'plugins.detail.state.error', variant: 'danger', icon: XCircle },
  inactive: { labelKey: 'plugins.detail.state.inactive', variant: 'neutral', icon: PowerOff },
  discovered: { labelKey: 'plugins.detail.state.discovered', variant: 'neutral', icon: Clock },
  validated: { labelKey: 'plugins.detail.state.validated', variant: 'neutral', icon: Clock },
  resolved: { labelKey: 'plugins.detail.state.resolved', variant: 'neutral', icon: Clock },
  activating: { labelKey: 'plugins.detail.state.activating', variant: 'neutral', icon: Clock },
}

/** Cynosure Badge colorScheme per contribution type. */
export const CONTRIBUTION_BADGE_VARIANTS: Record<string, 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  driver: 'accent',
  command: 'info',
  panel: 'success',
  exporter: 'warning',
  importer: 'warning',
  theme: 'neutral',
  middleware: 'neutral',
  setting: 'neutral',
}

export const DETAIL_TAB_IDS = ['overview', 'permissions', 'contributions', 'errors', 'settings'] as const
