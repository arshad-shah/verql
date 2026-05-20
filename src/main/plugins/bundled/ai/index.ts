// src/main/plugins/bundled/ai/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { AI_SERVICE_ID } from '../../sdk/ai-access'
import { startAIModule, type AIModule } from './internal'
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
    // The chat surface is rendered by the renderer's <PluginPanel> infrastructure
    // for any plugin contributing a "panels" entry with location 'sidebar'. When
    // this plugin is deactivated the contribution is removed and the panel vanishes.
    panels: [
      { id: 'ai-chat', title: 'AI Assistant', icon: 'sparkles', location: 'secondary' }
    ],
    settings: [
      {
        key: 'autoIncludeSchema',
        title: 'Auto-include schema context',
        description: 'Send a summary of the active connection’s schema with every message so the model can answer in context.',
        type: 'boolean',
        default: true,
        category: 'ai'
      },
      {
        key: 'maxContextMessages',
        title: 'Max context messages',
        description: 'How many of the most recent chat messages to keep in the model’s working context. Lower values reduce token cost.',
        type: 'number',
        default: 20,
        min: 1,
        max: 200,
        step: 1,
        category: 'ai'
      }
    ]
  }
}

let ai: AIModule | null = null

export function activate(ctx: PluginContext): void {
  // 1. Spin up the AI core (registries + providers + IPC channels + streaming).
  ai = startAIModule({
    keyring: ctx.keyring,
    schemaAccess: ctx.schema,
    connectionAccess: ctx.connections,
    settingsStore: ctx.rootSettings,
    ipc: ctx.ipc,
    broadcast: ctx.broadcast
  })

  // 2. Expose the AI service so other plugins' `ctx.ai.registerTool` calls land.
  //    Buffered registrations from plugins that activated earlier are flushed
  //    automatically by the ServiceRegistry.onAvailable mechanism.
  ctx.services.provide(AI_SERVICE_ID, ai.service)

  // 3. Register first-party tools.
  for (const tool of createSchemaTools(ctx.schema)) ctx.ai.registerTool(tool)
  for (const tool of createQueryTools(ctx.connections)) ctx.ai.registerTool(tool)

  // 4. Declare the chat sidebar panel. The renderer mounts <ChatPanel/> when it
  //    sees the contribution; removing the plugin removes the contribution.
  ctx.ui.registerPanel('ai-chat', [
    { id: 'ai-chat-root', type: 'host-component', componentId: 'ai-chat-panel' }
  ])

  // 4b. Plug into named slots in the host shell. The host doesn't know these
  //     widgets are AI — it just renders whatever's contributed. Disabling
  //     this plugin disposes the registrations and the slots empty out.
  ctx.ui.registerSlot('app.activityBar.bottom', [
    { id: 'ai-toggle', type: 'host-component', componentId: 'ai-toggle-button' }
  ])
  ctx.ui.registerSlot('query.editor.top', [
    { id: 'ai-nl', type: 'host-component', componentId: 'ai-nl-input' }
  ])
  ctx.ui.registerSlot('results.actions', [
    { id: 'ai-explain', type: 'host-component', componentId: 'ai-explain' }
  ])

  // 5. Commands that future renderer surfaces invoke via the command palette.
  ctx.commands.register('explain-table', async () => { /* renderer opens chat with context */ })
  ctx.commands.register('suggest-queries', async () => { /* renderer opens chat */ })
  ctx.commands.register('explain-query', async () => { /* renderer opens chat */ })
  ctx.commands.register('optimize-query', async () => { /* renderer opens chat */ })

  // 6. Tear-down on plugin deactivation: abort streams, remove IPC handlers.
  ctx.subscriptions.push(ai.dispose)
}

export function deactivate(): void {
  ai = null
}
