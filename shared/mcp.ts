export interface MCPServerStatus {
  running: boolean
  port: number
  clients: number
  token: string
  autoSelectedPort: boolean
}

export interface MCPToolInfo {
  id: string
  name: string
  description: string
  permission: 'read' | 'write'
  enabled: boolean
}

export interface MCPActivityEntry {
  id: string
  timestamp: number
  toolId: string
  paramsSummary: string
  status: 'ok' | 'error' | 'rejected'
  durationMs: number
}

export interface MCPApprovalRequest {
  requestId: string
  toolId: string
  toolName: string
  sql: string
  permission: 'read' | 'write'
}

export interface MCPStartResult {
  port: number
  token: string
  autoSelectedPort: boolean
}

export function buildMcpClientConfig(opts: { port: number; token: string }): {
  mcpServers: { verql: { type: 'sse'; url: string; headers: { Authorization: string } } }
} {
  return {
    mcpServers: {
      verql: {
        type: 'sse',
        url: `http://localhost:${opts.port}/sse`,
        headers: { Authorization: `Bearer ${opts.token}` }
      }
    }
  }
}
