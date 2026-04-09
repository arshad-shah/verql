import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { SnowflakeAdapter } from './snowflake-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-snowflake',
  version: '1.0.0',
  displayName: 'Snowflake',
  description: 'Snowflake data warehouse driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'snowflake', name: 'Snowflake' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('snowflake', {
    createAdapter: (config) => new SnowflakeAdapter(config),
    connectionFields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'host', label: 'Host Override', type: 'text' },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', default: 'PUBLIC' },
      { key: 'warehouse', label: 'Warehouse', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'authenticator', label: 'Authenticator', type: 'text', default: 'externalbrowser' },
    ]
  })
}
