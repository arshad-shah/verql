import { z } from 'zod'
import type { Tool, ToolContext, ToolResult } from '../../sdk/types'
import type { SchemaAccess, ConnectionAccess } from '../../sdk/types'

function noConn(): ToolResult {
  return { success: false, data: null, display: 'No active database connection in Verql' }
}

/**
 * Wraps a query in race against the tool's abort signal. If the signal aborts
 * mid-query we ask the connection's adapter to cancel; the promise still
 * settles with a rejected sentinel that callers turn into a tool-result.
 */
async function withCancellation<T>(
  connections: ConnectionAccess,
  ctx: ToolContext,
  run: () => Promise<T>,
): Promise<T> {
  if (ctx.abortSignal.aborted) throw new Error('Cancelled')
  let onAbort: (() => void) | undefined
  try {
    return await new Promise<T>((resolve, reject) => {
      onAbort = () => {
        if (ctx.connectionId) connections.cancelQuery(ctx.connectionId)
        reject(new Error('Cancelled'))
      }
      ctx.abortSignal.addEventListener('abort', onAbort)
      run().then(resolve, reject)
    })
  } finally {
    if (onAbort) ctx.abortSignal.removeEventListener('abort', onAbort)
  }
}

/**
 * The canonical database tools. `getMaxRows` is read per-call so the row cap
 * tracks the live MCP setting without re-creating the tools.
 */
export function createDbTools(
  schema: SchemaAccess,
  connections: ConnectionAccess,
  getMaxRows: () => number
): Tool[] {
  return [
    {
      id: 'query',
      name: 'Run Query',
      description: 'Execute a SQL query against the active database connection. Use this to read data, insert, update, or delete records.',
      inputSchema: z.object({ sql: z.string().describe('The SQL query to execute') }),
      permission: 'write',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const result = await withCancellation(connections, ctx, () =>
          connections.query(ctx.connectionId!, params.sql as string),
        )
        const max = getMaxRows()
        return {
          success: true,
          data: {
            rows: result.rows.slice(0, max),
            rowCount: result.rowCount,
            fields: result.fields.map(f => ({ name: f.name, dataType: f.dataType })),
            duration: result.duration,
            affectedRows: result.affectedRows,
          },
          display: `Query returned ${result.rowCount} row(s)`
        }
      }
    },
    {
      id: 'explain_query',
      name: 'Explain Query',
      description: 'Run EXPLAIN on a SQL query to show its execution plan. Read-only.',
      inputSchema: z.object({ sql: z.string().describe('The SQL query to explain') }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const result = await withCancellation(connections, ctx, () =>
          connections.query(ctx.connectionId!, `EXPLAIN ${params.sql as string}`),
        )
        return { success: true, data: result.rows, display: `Execution plan (${result.rows.length} step(s))` }
      }
    },
    {
      id: 'list_tables',
      name: 'List Tables',
      description: 'List all tables in the current database schema.',
      inputSchema: z.object({ schema: z.string().optional().describe('Schema name (optional)') }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const tables = await schema.getTables(ctx.connectionId, params.schema as string | undefined)
        return {
          success: true,
          data: tables.map(t => ({ name: t.name, type: t.type, rowCount: t.rowCount })),
          display: `Found ${tables.length} table(s)`
        }
      }
    },
    {
      id: 'describe_table',
      name: 'Describe Table',
      description: 'Get detailed information about a table including columns, types, indexes, and foreign key relationships.',
      inputSchema: z.object({
        table: z.string().describe('Table name to describe'),
        schema: z.string().optional().describe('Schema name (optional)')
      }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const table = params.table as string
        const schemaName = params.schema as string | undefined
        const [columns, indexes] = await Promise.all([
          schema.getColumns(ctx.connectionId, table, schemaName),
          schema.getIndexes(ctx.connectionId, table, schemaName)
        ])
        return { success: true, data: { columns, indexes }, display: `${table}: ${columns.length} column(s), ${indexes.length} index(es)` }
      }
    },
    {
      id: 'get_schemas',
      name: 'Get Schemas',
      description: 'List all available schemas or databases on the current connection.',
      inputSchema: z.object({}),
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const [schemas, databases] = await Promise.all([
          schema.getSchemas(ctx.connectionId).catch(() => [] as string[]),
          schema.getDatabases(ctx.connectionId).catch(() => [] as string[])
        ])
        return { success: true, data: { schemas, databases }, display: `${schemas.length} schema(s), ${databases.length} database(s)` }
      }
    },
    {
      id: 'connection_info',
      name: 'Connection Info',
      description: 'Get information about the currently active database connection including type, host, and database name.',
      inputSchema: z.object({}),
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const profile = connections.getProfile(ctx.connectionId)
        if (!profile) return noConn()
        return {
          success: true,
          data: { type: profile.type, host: profile.host, port: profile.port, database: profile.database, name: profile.name },
          display: profile.name
        }
      }
    }
  ]
}
