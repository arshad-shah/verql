// src/main/plugins/bundled/ai/tools/schema-tools.ts
import type { AITool, AIToolContext, AIToolExecutionResult } from '../../../../ai/types'
import type { SchemaAccess } from '../../../sdk/types'

export function createSchemaTools(schema: SchemaAccess): AITool[] {
  return [
    {
      id: 'schema_list_tables',
      name: 'List Tables',
      description: 'List all tables in the current database schema. Returns table names and types.',
      parameters: {
        type: 'object',
        properties: {
          schema: { type: 'string', description: 'Schema name (optional)' }
        }
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const tables = await schema.getTables(ctx.connectionId, params.schema as string | undefined)
        return { success: true, data: tables, display: `Found ${tables.length} table(s)` }
      }
    },
    {
      id: 'schema_describe_table',
      name: 'Describe Table',
      description: 'Get column definitions, types, primary keys, and foreign keys for a specific table.',
      parameters: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          schema: { type: 'string', description: 'Schema name (optional)' }
        },
        required: ['table']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
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
      id: 'schema_get_relationships',
      name: 'Get Relationships',
      description: 'Get foreign key relationships for a table.',
      parameters: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          schema: { type: 'string', description: 'Schema name (optional)' }
        },
        required: ['table']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const columns = await schema.getColumns(ctx.connectionId, params.table as string, params.schema as string | undefined)
        const fks = columns.filter(c => c.isForeignKey)
        return { success: true, data: fks, display: `${fks.length} foreign key(s)` }
      }
    },
    {
      id: 'connection_info',
      name: 'Connection Info',
      description: 'Get information about available schemas and databases.',
      parameters: { type: 'object', properties: {} },
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const [schemas, databases] = await Promise.all([
          schema.getSchemas(ctx.connectionId).catch(() => [] as string[]),
          schema.getDatabases(ctx.connectionId).catch(() => [] as string[])
        ])
        return { success: true, data: { schemas, databases, connectionId: ctx.connectionId }, display: `${schemas.length} schema(s), ${databases.length} database(s)` }
      }
    }
  ]
}
