import { createMCPServer, type MCPServerInstance } from '../mcp/server'
import type { ConnectionAccessImpl } from '../plugins/sdk/connection-access'
import type { ToolRegistry } from '../plugins/sdk/types'
import type { MCPToolInfo } from '@shared/mcp'
import { generateToken } from '../mcp/auth'
import type { IpcContext, Handle } from './context'

export interface SettingsStoreFacade {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export function registerMcpHandlers(
  ctx: IpcContext,
  handle: Handle,
  connectionAccess: ConnectionAccessImpl,
  settingsStore: SettingsStoreFacade,
  toolRegistry: ToolRegistry
): MCPServerInstance {
  const mcpServer = createMCPServer({
    toolRegistry,
    getActiveConnectionId: () => connectionAccess.getActiveConnectionId(),
    settingsStore,
  })

  handle('mcp:start', async () => {
    const result = await mcpServer.start()
    ctx.configStore.setSetting('mcp.enabled', true)
    return result
  })

  handle('mcp:stop', async () => {
    await mcpServer.stop()
    ctx.configStore.setSetting('mcp.enabled', false)
  })

  handle('mcp:status', async () => mcpServer.getStatus())

  handle('mcp:tools', async (): Promise<MCPToolInfo[]> => {
    const disabled = (ctx.configStore.getSetting('mcp.disabledTools') as string[]) ?? []
    return toolRegistry.list().map(t => ({
      id: t.id, name: t.name, description: t.description, permission: t.permission,
      enabled: !disabled.includes(t.id),
    }))
  })

  handle('mcp:set-tool-enabled', async (toolId, enabled) => {
    const disabled = new Set((ctx.configStore.getSetting('mcp.disabledTools') as string[]) ?? [])
    if (enabled) disabled.delete(toolId)
    else disabled.add(toolId)
    ctx.configStore.setSetting('mcp.disabledTools', [...disabled])
    if (mcpServer.getStatus().running) { await mcpServer.stop(); await mcpServer.start() }
  })

  handle('mcp:activity', async () => mcpServer.getActivity())

  handle('mcp:regenerate-token', async () => {
    const wasRunning = mcpServer.getStatus().running
    if (wasRunning) await mcpServer.stop()
    // Mint a fresh token; the server persists it on next start, but set it now
    // so a stopped server also reflects the new token immediately.
    ctx.configStore.setSetting('mcp.token', generateToken())
    if (wasRunning) await mcpServer.start()
    return mcpServer.getStatus()
  })

  handle('mcp:approval-response', async (requestId, approved) => {
    mcpServer.resolveApproval(requestId, approved)
  })

  return mcpServer
}
