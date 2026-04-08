import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import { SqliteAdapter } from './sqlite'
import { PostgresAdapter } from './postgres'
import { MysqlAdapter } from './mysql'

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
      const _exhaustive: never = profile.type
      throw new Error(`Unsupported database type: ${_exhaustive}`)
    }
  }
}
