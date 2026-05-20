import { createMCPServer } from '../mcp/server'
import type { ConnectionAccessImpl } from '../plugins/sdk/connection-access'
import type { IpcContext, Handle } from './context'

export interface SettingsStoreFacade {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export function registerMcpHandlers(
  ctx: IpcContext,
  handle: Handle,
  connectionAccess: ConnectionAccessImpl,
  settingsStore: SettingsStoreFacade
) {
  const mcpServer = createMCPServer({
    toolContext: {
      getAdapter: () => {
        const activeId = connectionAccess.getActiveConnectionId()
        return activeId ? ctx.activeAdapters.get(activeId) : undefined
      },
      getProfile: () => {
        const activeId = connectionAccess.getActiveConnectionId()
        return activeId ? ctx.configStore.getConnection(activeId) : undefined
      },
      requestApproval: async () => true
    },
    settingsStore
  })

  handle('mcp:start', async () => {
    const port = (ctx.configStore.getSetting('mcp.port') as number) || 3100
    const result = await mcpServer.start(port)
    ctx.configStore.setSetting('mcp.enabled', true)
    return result
  })

  handle('mcp:stop', async () => {
    await mcpServer.stop()
    ctx.configStore.setSetting('mcp.enabled', false)
  })

  handle('mcp:status', async () => mcpServer.getStatus())

  handle('mcp:approval-response', async (requestId, approved) => {
    mcpServer.resolveApproval(requestId, approved)
  })

  if (ctx.configStore.getSetting('mcp.enabled') as boolean) {
    const mcpPort = (ctx.configStore.getSetting('mcp.port') as number) || 3100
    mcpServer.start(mcpPort).catch(err => console.error('[mcp] Auto-start failed:', err))
  }

  return mcpServer
}
