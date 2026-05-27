import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { createDbTools } from './tools'

export const manifest: PluginManifest = {
  name: 'verql-plugin-db-tools',
  version: '1.0.0',
  displayName: 'Database Tools',
  description: 'Core database tools (query, schema inspection) shared by the AI assistant and the MCP server.',
  main: 'index.js',
  contributes: {}
}

export function activate(ctx: PluginContext): void {
  // maxRows is read live from the root settings so the MCP row cap applies here too.
  const getMaxRows = (): number => {
    const v = ctx.rootSettings.get('mcp.maxRows')
    return typeof v === 'number' && v > 0 ? v : 500
  }
  // ctx.tools.register auto-tracks the disposable on the plugin's subscriptions.
  for (const tool of createDbTools(ctx.schema, ctx.connections, getMaxRows)) {
    ctx.tools.register(tool)
  }
}

export function deactivate(): void { /* tool registrations are disposed via subscriptions */ }
