import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { MysqlAdapter } from './mysql-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-mysql',
  version: '1.0.0',
  displayName: 'MySQL',
  description: 'MySQL database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'mysql', name: 'MySQL' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('mysql', {
    createAdapter: (config) => new MysqlAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 3306 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false },
    ]
  })
}
