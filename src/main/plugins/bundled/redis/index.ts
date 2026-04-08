import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { RedisAdapter } from './redis-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-redis',
  version: '1.0.0',
  displayName: 'Redis',
  description: 'Redis database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'redis', name: 'Redis' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('redis', {
    createAdapter: (config) => new RedisAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 6379 },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database (0-15)', type: 'number', default: 0 },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false }
    ]
  })
}
