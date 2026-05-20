import type { ConnectionProfile } from '@shared/types'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

/**
 * Connection fields whose values must never leave the main process.
 * Includes the canonical `password` plus any plugin-declared field with type 'password'.
 * Renderer receives a sentinel marker instead of the real value.
 */
export const SECRET_PLACEHOLDER = '__SECRET_PRESENT__'

export function getSecretFieldKeys(driverRegistry: DriverRegistryImpl): Set<string> {
  const keys = new Set<string>(['password'])
  for (const id of driverRegistry.getDriverIds()) {
    const factory = driverRegistry.get(id)
    for (const f of factory?.connectionFields ?? []) {
      if (f.type === 'password') keys.add(f.key)
    }
  }
  return keys
}

export function redactConnection(
  profile: ConnectionProfile,
  secretKeys: Set<string>
): ConnectionProfile {
  const out = { ...profile } as ConnectionProfile & Record<string, unknown>
  for (const key of secretKeys) {
    const v = out[key]
    if (v !== undefined && v !== '' && v !== null) out[key] = SECRET_PLACEHOLDER
  }
  return out
}

export function mergeIncomingProfile(
  incoming: ConnectionProfile,
  existing: ConnectionProfile | undefined,
  secretKeys: Set<string>
): ConnectionProfile {
  if (!existing) return incoming
  const merged = { ...incoming } as ConnectionProfile & Record<string, unknown>
  const exist = existing as ConnectionProfile & Record<string, unknown>
  for (const key of secretKeys) {
    const val = merged[key]
    if (val === SECRET_PLACEHOLDER || val === undefined || val === '') {
      const existingVal = exist[key]
      if (existingVal !== undefined) merged[key] = existingVal
      else delete merged[key]
    }
  }
  return merged
}

/** AI keys live in the keyring; never echo their values back to the renderer. */
export function redactAi<T extends Record<string, unknown>>(ai: T): T {
  return { ...ai, openaiKey: '', anthropicKey: '' }
}

export function redactSettings<T extends { ai?: unknown }>(settings: T): T {
  if (settings.ai) {
    return { ...settings, ai: redactAi(settings.ai as Record<string, unknown>) }
  }
  return settings
}
