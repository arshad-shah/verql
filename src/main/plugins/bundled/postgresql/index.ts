import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { PostgresAdapter } from './postgres-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-postgresql',
  version: '1.0.0',
  displayName: 'PostgreSQL',
  description: 'PostgreSQL database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'postgresql', name: 'PostgreSQL' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('postgresql', {
    createAdapter: (config) => new PostgresAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 5432 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false },
    ]
  })
}
