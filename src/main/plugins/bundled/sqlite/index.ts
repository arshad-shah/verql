import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { SqliteAdapter } from './sqlite-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-sqlite',
  version: '1.0.0',
  displayName: 'SQLite',
  description: 'SQLite database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'sqlite', name: 'SQLite' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('sqlite', {
    createAdapter: (config) => new SqliteAdapter(config),
    connectionFields: [
      { key: 'database', label: 'Database File', type: 'file', required: true },
    ]
  })
}
