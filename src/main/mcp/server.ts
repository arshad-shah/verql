import { createServer, type Server as HttpServer, type IncomingMessage, type ServerResponse } from 'http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { BrowserWindow } from 'electron'
import { z } from 'zod'
import { generateToken, validateAuth } from './auth'
import type { MCPToolContext } from './tools'
import { isWriteQuery } from './tools'

interface MCPServerDeps {
  toolContext: MCPToolContext
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

interface MCPServerInstance {
  start: (port: number) => Promise<{ port: number; token: string }>
  stop: () => Promise<void>
  getStatus: () => { running: boolean; port: number; clients: number; token: string }
  resolveApproval: (requestId: string, approved: boolean) => void
}

export function createMCPServer(deps: MCPServerDeps): MCPServerInstance {
  let httpServer: HttpServer | null = null
  let mcpServer: McpServer | null = null
  let token = ''
  let currentPort = 0
  let transport: SSEServerTransport | null = null
  let clientCount = 0

  // Approval flow
  const pendingApprovals = new Map<string, (approved: boolean) => void>()

  function requestApproval(sql: string): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID()
      pendingApprovals.set(requestId, resolve)

      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('mcp:approval-request', { requestId, sql, source: 'mcp' })
      } else {
        resolve(false)
        pendingApprovals.delete(requestId)
      }

      setTimeout(() => {
        if (pendingApprovals.has(requestId)) {
          pendingApprovals.delete(requestId)
          resolve(false)
        }
      }, 5 * 60 * 1000)
    })
  }

  function resolveApproval(requestId: string, approved: boolean): void {
    const resolver = pendingApprovals.get(requestId)
    if (resolver) {
      resolver(approved)
      pendingApprovals.delete(requestId)
    }
  }

  async function start(port: number): Promise<{ port: number; token: string }> {
    if (httpServer) await stop()

    const savedToken = deps.settingsStore.get('mcp.token') as string
    if (savedToken) {
      token = savedToken
    } else {
      token = generateToken()
      deps.settingsStore.set('mcp.token', token)
    }

    currentPort = port
    const ctx = deps.toolContext

    mcpServer = new McpServer(
      { name: 'dbstudio', version: '0.1.0' },
      { capabilities: { tools: {} } }
    )

    // ─── Register tools with Zod schemas ─────────────────────────────────────

    mcpServer.tool(
      'query',
      'Execute a SQL query against the active database connection. Use this to read data, insert, update, or delete records.',
      { sql: z.string().describe('The SQL query to execute') },
      async ({ sql }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }

        if (isWriteQuery(sql)) {
          const approved = await requestApproval(sql)
          if (!approved) return { content: [{ type: 'text', text: 'Query rejected by user in dbstudio' }], isError: true }
        }

        try {
          const result = await adapter.query(sql)
          const text = JSON.stringify({
            rows: result.rows.slice(0, 500),
            rowCount: result.rowCount,
            fields: result.fields.map(f => ({ name: f.name, dataType: f.dataType })),
            duration: result.duration,
            affectedRows: result.affectedRows
          }, null, 2)
          return { content: [{ type: 'text', text }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      }
    )

    mcpServer.tool(
      'explain_query',
      'Run EXPLAIN on a SQL query to show its execution plan. Read-only.',
      { sql: z.string().describe('The SQL query to explain') },
      async ({ sql }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }
        try {
          const result = await adapter.query(`EXPLAIN ${sql}`)
          return { content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      }
    )

    mcpServer.tool(
      'list_tables',
      'List all tables in the current database schema.',
      { schema: z.string().optional().describe('Schema name (optional, uses default if omitted)') },
      async ({ schema }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }
        try {
          const tables = await adapter.getTables(schema)
          const text = JSON.stringify(tables.map(t => ({ name: t.name, type: t.type, rowCount: t.rowCount })), null, 2)
          return { content: [{ type: 'text', text }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      }
    )

    mcpServer.tool(
      'describe_table',
      'Get detailed information about a table including columns, types, indexes, and foreign key relationships.',
      {
        table: z.string().describe('Table name to describe'),
        schema: z.string().optional().describe('Schema name (optional)')
      },
      async ({ table, schema }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }
        try {
          const [columns, indexes] = await Promise.all([
            adapter.getColumns(table, schema),
            adapter.getIndexes(table, schema)
          ])
          return { content: [{ type: 'text', text: JSON.stringify({ columns, indexes }, null, 2) }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      }
    )

    mcpServer.tool(
      'get_schemas',
      'List all available schemas or databases on the current connection.',
      {},
      async () => {
        const adapter = ctx.getAdapter()
        if (!adapter) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }
        try {
          let schemas: string[] = []
          try { schemas = await adapter.getSchemas() } catch { /* */ }
          let databases: string[] = []
          try { databases = await adapter.getDatabases() } catch { /* */ }
          return { content: [{ type: 'text', text: JSON.stringify({ schemas, databases }, null, 2) }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      }
    )

    mcpServer.tool(
      'connection_info',
      'Get information about the currently active database connection including type, host, and database name.',
      {},
      async () => {
        const profile = ctx.getProfile()
        if (!profile) return { content: [{ type: 'text', text: 'Error: No active database connection in dbstudio' }], isError: true }
        const text = JSON.stringify({
          type: profile.type,
          host: profile.host,
          port: profile.port,
          database: profile.database,
          name: profile.name
        }, null, 2)
        return { content: [{ type: 'text', text }] }
      }
    )

    // ─── HTTP Server ─────────────────────────────────────────────────────────

    httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (!validateAuth(req, token, res)) return

      const url = new URL(req.url ?? '/', `http://localhost:${currentPort}`)

      if (url.pathname === '/sse' && req.method === 'GET') {
        transport = new SSEServerTransport('/messages', res)
        clientCount++

        transport.onclose = () => {
          clientCount = Math.max(0, clientCount - 1)
          transport = null
        }

        mcpServer!.connect(transport).catch((err) => {
          console.error('[mcp] SSE connection error:', err)
        })
        return
      }

      if (url.pathname === '/messages' && req.method === 'POST') {
        if (!transport) {
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'No active SSE connection' }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            transport!.handlePostMessage(req, res, parsed)
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', name: 'dbstudio-mcp' }))
        return
      }

      res.writeHead(404)
      res.end('Not found')
    })

    return new Promise((resolve, reject) => {
      httpServer!.listen(currentPort, '127.0.0.1', () => {
        console.log(`[mcp] Server started on http://127.0.0.1:${currentPort}`)
        resolve({ port: currentPort, token })
      })
      httpServer!.on('error', reject)
    })
  }

  async function stop(): Promise<void> {
    if (transport) {
      try { await transport.close() } catch { /* */ }
      transport = null
    }
    if (mcpServer) {
      try { await mcpServer.close() } catch { /* */ }
      mcpServer = null
    }
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer!.close(() => resolve())
      })
      httpServer = null
    }
    clientCount = 0
    console.log('[mcp] Server stopped')
  }

  function getStatus() {
    return { running: httpServer !== null, port: currentPort, clients: clientCount, token }
  }

  return { start, stop, getStatus, resolveApproval }
}
