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
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'authenticator', label: 'Authenticator', type: 'text', default: 'externalbrowser' },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'role', label: 'Role', type: 'select', fetchable: true, step: 1 },
      { key: 'warehouse', label: 'Warehouse', type: 'select', fetchable: true, step: 1 },
      { key: 'database', label: 'Database', type: 'select', fetchable: true, step: 2 },
      { key: 'schema', label: 'Schema', type: 'select', fetchable: true, step: 2, default: 'PUBLIC' },
    ]
  })
}
