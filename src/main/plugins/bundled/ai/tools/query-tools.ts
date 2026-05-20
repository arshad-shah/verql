// src/main/plugins/bundled/ai/tools/query-tools.ts
import type { AITool, AIToolContext, AIToolExecutionResult } from '../../../../ai/types'
import type { ConnectionAccess } from '../../../sdk/types'

export function createQueryTools(connections: ConnectionAccess): AITool[] {
  return [
    {
      id: 'query_explain',
      name: 'Explain Query',
      description: 'Run EXPLAIN on a query to show the execution plan without executing it. Only works with databases that support EXPLAIN.',
      parameters: {
        type: 'object',
        properties: { sql: { type: 'string', description: 'The SQL query to explain' } },
        required: ['sql']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const result = await connections.query(ctx.connectionId, `EXPLAIN ${params.sql as string}`)
        return { success: true, data: result.rows, display: `Execution plan (${result.rows.length} step(s))` }
      }
    },
    {
      id: 'query_execute',
      name: 'Execute Query',
      description: 'Execute a query against the connected database. The query format depends on the database type — refer to the system context for the expected format.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The query string in the format expected by the connected database' } },
        required: ['query']
      },
      permission: 'write',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const query = (params.query ?? params.sql) as string
        const result = await connections.query(ctx.connectionId, query)
        return { success: true, data: { rows: result.rows, fields: result.fields, rowCount: result.rowCount }, display: `Query returned ${result.rowCount} row(s)` }
      }
    }
  ]
}
