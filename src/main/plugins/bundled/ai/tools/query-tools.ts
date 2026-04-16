// src/main/plugins/bundled/ai/tools/query-tools.ts
import type { AITool, AIToolContext, AIToolExecutionResult } from '../../../../ai/types'
import type { ConnectionAccess } from '../../../sdk/types'

export function createQueryTools(connections: ConnectionAccess): AITool[] {
  return [
    {
      id: 'query_explain',
      name: 'Explain Query',
      description: 'Run EXPLAIN on a SQL query to show the execution plan without executing it.',
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
      description: 'Execute a SQL query against the connected database.',
      parameters: {
        type: 'object',
        properties: { sql: { type: 'string', description: 'The SQL query to execute' } },
        required: ['sql']
      },
      permission: 'write',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const result = await connections.query(ctx.connectionId, params.sql as string)
        return { success: true, data: { rows: result.rows, fields: result.fields, rowCount: result.rowCount }, display: `Query returned ${result.rowCount} row(s)` }
      }
    }
  ]
}
