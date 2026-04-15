import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIToolRegistry } from '../../src/main/ai/tool-registry'
import type { AITool } from '../../src/main/ai/types'

function createMockTool(id: string, permission: 'read' | 'write' = 'read'): AITool {
  return {
    id,
    name: id,
    description: `Tool ${id}`,
    parameters: { type: 'object', properties: {} },
    permission,
    execute: vi.fn(async () => ({ success: true, data: `result-${id}` }))
  }
}

describe('AIToolRegistry', () => {
  let registry: AIToolRegistry

  beforeEach(() => {
    registry = new AIToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = createMockTool('schema.listTables')
    registry.register(tool)
    expect(registry.get('schema.listTables')).toBe(tool)
  })

  it('lists all tools', () => {
    registry.register(createMockTool('tool-a'))
    registry.register(createMockTool('tool-b'))
    expect(registry.list()).toHaveLength(2)
  })

  it('unregisters a tool', () => {
    registry.register(createMockTool('tool-a'))
    registry.unregister('tool-a')
    expect(registry.get('tool-a')).toBeUndefined()
  })

  it('returns tool definitions for LLM', () => {
    registry.register(createMockTool('schema.listTables'))
    const defs = registry.getToolDefinitions()
    expect(defs).toEqual([{
      name: 'schema.listTables',
      description: 'Tool schema.listTables',
      parameters: { type: 'object', properties: {} }
    }])
  })

  it('executes a tool', async () => {
    const tool = createMockTool('schema.listTables')
    registry.register(tool)
    const result = await registry.execute('schema.listTables', {}, {
      connectionId: 'conn-1',
      abortSignal: new AbortController().signal
    })
    expect(result.success).toBe(true)
    expect(result.data).toBe('result-schema.listTables')
  })

  it('throws when executing unknown tool', async () => {
    await expect(
      registry.execute('unknown', {}, { connectionId: null, abortSignal: new AbortController().signal })
    ).rejects.toThrow('Unknown AI tool: unknown')
  })
})
