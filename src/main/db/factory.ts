import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import { SqliteAdapter } from './sqlite'
import { PostgresAdapter } from './postgres'
import { MysqlAdapter } from './mysql'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

let pluginDriverRegistry: DriverRegistryImpl | null = null

export function setDriverRegistry(registry: DriverRegistryImpl): void {
  pluginDriverRegistry = registry
}

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  switch (profile.type) {
    case 'sqlite':
      return new SqliteAdapter(profile.database)
    case 'postgresql':
      return new PostgresAdapter({
        host: profile.host!, port: profile.port!, database: profile.database,
        user: profile.username, password: profile.password, ssl: profile.ssl
      })
    case 'mysql':
      return new MysqlAdapter({
        host: profile.host!, port: profile.port!, database: profile.database,
        user: profile.username, password: profile.password, ssl: profile.ssl
      })
    default: {
      if (pluginDriverRegistry) {
        const factory = pluginDriverRegistry.get(profile.type)
        if (factory) {
          return factory.createAdapter(profile as unknown as Record<string, unknown>)
        }
      }
      throw new Error(`Unsupported database type: ${profile.type}`)
    }
  }
}
