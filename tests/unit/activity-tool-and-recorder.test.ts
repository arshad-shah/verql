import { describe, it, expect, vi } from 'vitest'
import { ToolRegistryImpl } from '../../src/main/plugins/sdk/tool-registry'
import { createActivityTool } from '../../src/main/plugins/bundled/db-tools/tools'
import { ActivityLog } from '../../src/main/activity/log'
import type { Tool, ToolContext } from '../../src/main/plugins/sdk/types'

const ctx: ToolContext = { connectionId: 'c1', abortSignal: new AbortController().signal }

describe('ToolRegistry activity recorder', () => {
  function readTool(impl: () => Promise<{ success: boolean; data: unknown }>): Tool {
    return { id: 't', name: 't', description: 't', inputSchema: {}, permission: 'read', execute: impl } as unknown as Tool
  }

  it('records a successful tool call with duration', async () => {
    const reg = new ToolRegistryImpl()
    const calls: Array<Record<string, unknown>> = []
    reg.setActivityRecorder((info) => calls.push(info))
    reg.register(readTool(async () => ({ success: true, data: 1 })))

    await reg.execute('t', { sql: 'SELECT 1' }, ctx)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ toolId: 't', success: true })
    expect(typeof calls[0].durationMs).toBe('number')
  })

  it('records a thrown tool call as a failure and rethrows', async () => {
    const reg = new ToolRegistryImpl()
    const calls: Array<Record<string, unknown>> = []
    reg.setActivityRecorder((info) => calls.push(info))
    reg.register(readTool(async () => { throw new Error('boom') }))

    await expect(reg.execute('t', {}, ctx)).rejects.toThrow('boom')
    expect(calls[0]).toMatchObject({ toolId: 't', success: false, error: 'boom' })
  })

  it('does not require a recorder', async () => {
    const reg = new ToolRegistryImpl()
    reg.register(readTool(async () => ({ success: true, data: 1 })))
    await expect(reg.execute('t', {}, ctx)).resolves.toMatchObject({ success: true })
  })
})

describe('get_app_activity tool', () => {
  it('is a read tool visible to both surfaces', () => {
    const tool = createActivityTool(new ActivityLog())
    expect(tool.id).toBe('get_app_activity')
    expect(tool.permission).toBe('read')
    // surfaces unset → both AI and MCP expose it.
    expect(tool.surfaces).toBeUndefined()
  })

  it('returns recent entries, newest first, filtered by kind and limit', async () => {
    const log = new ActivityLog()
    log.record({ kind: 'connection', title: 'connected' })
    log.record({ kind: 'query', title: 'q1' })
    log.record({ kind: 'query', title: 'q2' })

    const tool = createActivityTool(log)
    const all = await tool.execute({}, ctx)
    expect((all.data as Array<{ title: string }>).map(e => e.title)).toEqual(['q2', 'q1', 'connected'])

    const queriesOnly = await tool.execute({ kinds: ['query'], limit: 1 }, ctx)
    expect((queriesOnly.data as Array<{ title: string }>).map(e => e.title)).toEqual(['q2'])
  })

  it('caps the limit at 500', async () => {
    const log = new ActivityLog(2000)
    for (let i = 0; i < 600; i++) log.record({ kind: 'query', title: `q${i}` })
    const tool = createActivityTool(log)
    const result = await tool.execute({ limit: 10_000 }, ctx)
    expect((result.data as unknown[]).length).toBe(500)
  })
})
