import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

let pluginDriverRegistry: DriverRegistryImpl | null = null

export function setDriverRegistry(registry: DriverRegistryImpl): void {
  pluginDriverRegistry = registry
}

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  if (!pluginDriverRegistry) {
    throw new Error('Driver registry not initialized')
  }
  const factory = pluginDriverRegistry.get(profile.type)
  if (!factory) {
    throw new Error(`No driver registered for type: ${profile.type}`)
  }
  return factory.createAdapter(profile as unknown as Record<string, unknown>)
}
