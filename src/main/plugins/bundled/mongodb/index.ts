import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { MongoAdapter } from './mongo-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-mongodb',
  version: '1.0.0',
  displayName: 'MongoDB',
  description: 'MongoDB database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'mongodb', name: 'MongoDB' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('mongodb', {
    createAdapter: (config) => new MongoAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 27017 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'authSource', label: 'Auth Source', type: 'text', default: 'admin' },
      { key: 'srv', label: 'Use SRV', type: 'boolean', default: false },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false }
    ]
  })
}
