import type { DbAdapter } from '../db/adapter'
import type { ConnectionProfile } from '@shared/types'

export interface MCPToolContext {
  getAdapter: () => DbAdapter | undefined
  getProfile: () => ConnectionProfile | undefined
  requestApproval: (sql: string) => Promise<boolean>
}

const WRITE_PATTERN = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b/i

export function isWriteQuery(sql: string): boolean {
  return WRITE_PATTERN.test(sql)
}

export function registerMCPTools(ctx: MCPToolContext) {
  return {
    query: {
      description: 'Execute a SQL query against the active database connection. Use this to read data, insert, update, or delete records.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          sql: { type: 'string', description: 'The SQL query to execute' }
        },
        required: ['sql']
      },
      handler: async (params: { sql: string }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) throw new Error('No active database connection in Verql')

        if (isWriteQuery(params.sql)) {
          const approved = await ctx.requestApproval(params.sql)
          if (!approved) {
            return {
              content: [{ type: 'text' as const, text: 'Query rejected by user in Verql' }],
              isError: true
            }
          }
        }

        const result = await adapter.query(params.sql)
        const text = JSON.stringify({
          rows: result.rows.slice(0, 500),
          rowCount: result.rowCount,
          fields: result.fields.map(f => ({ name: f.name, dataType: f.dataType })),
          duration: result.duration,
          affectedRows: result.affectedRows
        }, null, 2)
        return { content: [{ type: 'text' as const, text }] }
      }
    },

    explain_query: {
      description: 'Run EXPLAIN on a SQL query to show its execution plan. Read-only, does not modify data.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          sql: { type: 'string', description: 'The SQL query to explain' }
        },
        required: ['sql']
      },
      handler: async (params: { sql: string }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) throw new Error('No active database connection in Verql')
        const result = await adapter.query(`EXPLAIN ${params.sql}`)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }]
        }
      }
    },

    list_tables: {
      description: 'List all tables in the current database schema.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          schema: { type: 'string', description: 'Schema name (optional, uses default if omitted)' }
        }
      },
      handler: async (params: { schema?: string }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) throw new Error('No active database connection in Verql')
        const tables = await adapter.getTables(params.schema)
        const text = JSON.stringify(tables.map(t => ({
          name: t.name,
          type: t.type,
          rowCount: t.rowCount
        })), null, 2)
        return { content: [{ type: 'text' as const, text }] }
      }
    },

    describe_table: {
      description: 'Get detailed information about a table including columns, types, indexes, and foreign key relationships.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          table: { type: 'string', description: 'Table name to describe' },
          schema: { type: 'string', description: 'Schema name (optional)' }
        },
        required: ['table']
      },
      handler: async (params: { table: string; schema?: string }) => {
        const adapter = ctx.getAdapter()
        if (!adapter) throw new Error('No active database connection in Verql')
        const [columns, indexes] = await Promise.all([
          adapter.getColumns(params.table, params.schema),
          adapter.getIndexes(params.table, params.schema)
        ])
        const text = JSON.stringify({ columns, indexes }, null, 2)
        return { content: [{ type: 'text' as const, text }] }
      }
    },

    get_schemas: {
      description: 'List all available schemas or databases on the current connection.',
      inputSchema: { type: 'object' as const, properties: {} },
      handler: async () => {
        const adapter = ctx.getAdapter()
        if (!adapter) throw new Error('No active database connection in Verql')
        let schemas: string[] = []
        try { schemas = await adapter.getSchemas() } catch { /* */ }
        let databases: string[] = []
        try { databases = await adapter.getDatabases() } catch { /* */ }
        const text = JSON.stringify({ schemas, databases }, null, 2)
        return { content: [{ type: 'text' as const, text }] }
      }
    },

    connection_info: {
      description: 'Get information about the currently active database connection including type, host, and database name.',
      inputSchema: { type: 'object' as const, properties: {} },
      handler: async () => {
        const profile = ctx.getProfile()
        if (!profile) throw new Error('No active database connection in Verql')
        const text = JSON.stringify({
          type: profile.type,
          host: profile.host,
          port: profile.port,
          database: profile.database,
          name: profile.name
        }, null, 2)
        return { content: [{ type: 'text' as const, text }] }
      }
    }
  }
}
