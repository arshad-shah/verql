import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { toJsonSchema } from '../../../src/main/plugins/sdk/tool-schema'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'

// A focused contract test: a tool registered through one holder of a shared
// ToolRegistry instance is visible to another holder (e.g. plugin side vs MCP side).
describe('shared ToolRegistry contract', () => {
  it('a tool registered by one holder is visible to another holder of the same instance', () => {
    const shared = new ToolRegistryImpl()
    const pluginSide = shared
    const mcpSide = shared
    pluginSide.register({
      id: 'query', name: 'Query', description: 'run sql',
      inputSchema: toJsonSchema(z.object({ sql: z.string() })), permission: 'write',
      async execute() { return { success: true, data: null } }
    })
    expect(mcpSide.get('query')?.permission).toBe('write')
    expect(mcpSide.getToolDefinitions().map(d => d.name)).toContain('query')
  })
})
