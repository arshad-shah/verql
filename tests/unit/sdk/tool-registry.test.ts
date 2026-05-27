import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'
import type { Tool } from '../../../src/main/plugins/sdk/types'

function makeTool(id: string): Tool {
  return {
    id, name: id, description: `desc ${id}`,
    inputSchema: z.object({ x: z.string() }),
    permission: 'read',
    async execute(params) { return { success: true, data: params } }
  }
}

describe('ToolRegistryImpl', () => {
  it('registers, gets, lists and disposes', () => {
    const r = new ToolRegistryImpl()
    const d = r.register(makeTool('a'))
    expect(r.get('a')?.id).toBe('a')
    expect(r.list()).toHaveLength(1)
    d.dispose()
    expect(r.get('a')).toBeUndefined()
    expect(r.list()).toHaveLength(0)
  })

  it('derives JSON-schema tool definitions keyed by id', () => {
    const r = new ToolRegistryImpl()
    r.register(makeTool('a'))
    const defs = r.getToolDefinitions()
    expect(defs[0].name).toBe('a')
    expect((defs[0].parameters as { properties: object }).properties).toHaveProperty('x')
  })

  it('executes a registered tool and throws for unknown ids', async () => {
    const r = new ToolRegistryImpl()
    r.register(makeTool('a'))
    const res = await r.execute('a', { x: '1' }, { connectionId: 'c', abortSignal: new AbortController().signal })
    expect(res).toEqual({ success: true, data: { x: '1' } })
    await expect(r.execute('nope', {}, { connectionId: null, abortSignal: new AbortController().signal }))
      .rejects.toThrow(/Unknown tool/)
  })

  it('notifies onChange on register and unregister', () => {
    const r = new ToolRegistryImpl()
    const cb = vi.fn()
    r.onChange(cb)
    const d = r.register(makeTool('a'))
    d.dispose()
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
