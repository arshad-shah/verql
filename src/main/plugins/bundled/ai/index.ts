// src/main/plugins/bundled/ai/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { createSchemaTools } from './tools/schema-tools'
import { createQueryTools } from './tools/query-tools'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-ai',
  version: '1.0.0',
  displayName: 'AI Assistant',
  description:
    'AI-powered database assistant with natural language queries, schema exploration, and contextual actions',
  main: 'index.js',
  contributes: {
    commands: [
      { id: 'explain-table', title: 'AI: Explain Table' },
      { id: 'suggest-queries', title: 'AI: Generate Sample Queries' },
      { id: 'explain-query', title: 'AI: Explain Query' },
      { id: 'optimize-query', title: 'AI: Optimize Query' }
    ],
    settings: [
      { key: 'provider', title: 'AI Provider', type: 'text', default: '' },
      { key: 'model', title: 'AI Model', type: 'text', default: '' },
      {
        key: 'autoIncludeSchema',
        title: 'Auto-include schema context',
        type: 'boolean',
        default: true
      },
      {
        key: 'maxContextMessages',
        title: 'Max context messages',
        type: 'number',
        default: 20
      }
    ]
  }
}

export function activate(ctx: PluginContext): void {
  // Register schema tools
  const schemaTools = createSchemaTools(ctx.schema)
  for (const tool of schemaTools) {
    ctx.ai.registerTool(tool)
  }

  // Register query tools
  const queryTools = createQueryTools(ctx.connections)
  for (const tool of queryTools) {
    ctx.ai.registerTool(tool)
  }

  // Register commands
  ctx.commands.register('explain-table', async (_payload) => {
    // Command handler — renderer will open chat with context
  })

  ctx.commands.register('suggest-queries', async (_payload) => {
    // Command handler
  })

  ctx.commands.register('explain-query', async (_payload) => {
    // Command handler
  })

  ctx.commands.register('optimize-query', async (_payload) => {
    // Command handler
  })
}
