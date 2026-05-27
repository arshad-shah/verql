import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { selectExposedTools, needsApprovalForCall, summarizeParams, createMCPServer } from '../../../src/main/mcp/server'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'
import type { Tool } from '../../../src/main/plugins/sdk/types'

function tool(id: string, permission: 'read' | 'write'): Tool {
  return { id, name: id, description: id, inputSchema: z.object({ sql: z.string().optional() }), permission, async execute() { return { success: true, data: null } } }
}

describe('selectExposedTools', () => {
  const all = [tool('query', 'write'), tool('list_tables', 'read')]
  it('hides disabled tools', () => {
    expect(selectExposedTools(all, { disabledTools: ['query'], readOnly: false }).map(t => t.id)).toEqual(['list_tables'])
  })
  it('hides write tools in read-only mode', () => {
    expect(selectExposedTools(all, { disabledTools: [], readOnly: true }).map(t => t.id)).toEqual(['list_tables'])
  })
  it('hides tools not exposed to the mcp surface', () => {
    const aiOnly: Tool = { ...tool('perform_app_action', 'read'), surfaces: ['ai'] }
    const exposed = selectExposedTools([...all, aiOnly], { disabledTools: [], readOnly: false }).map(t => t.id)
    expect(exposed).not.toContain('perform_app_action')
    expect(exposed).toContain('query')
  })
})

describe('needsApprovalForCall', () => {
  it('requires approval for write-permission tools', () => {
    expect(needsApprovalForCall(tool('query', 'write'), {})).toBe(true)
  })
  it('requires approval when a read tool is handed write SQL', () => {
    expect(needsApprovalForCall(tool('explain_query', 'read'), { sql: 'SELECT 1; DROP TABLE t' })).toBe(true)
  })
  it('does not require approval for a pure read', () => {
    expect(needsApprovalForCall(tool('list_tables', 'read'), {})).toBe(false)
  })
})

describe('summarizeParams', () => {
  it('truncates long params for the activity log', () => {
    expect(summarizeParams({ sql: 'x'.repeat(200) }).length).toBeLessThanOrEqual(120)
  })
})

describe('createMCPServer.regenerateToken', () => {
  it('mints + persists a fresh token reflected in status while stopped', () => {
    const store = new Map<string, unknown>()
    const server = createMCPServer({
      toolRegistry: new ToolRegistryImpl(),
      getActiveConnectionId: () => null,
      settingsStore: { get: (k) => store.get(k), set: (k, v) => { store.set(k, v) } },
    })
    expect(server.getStatus().token).toBe('')
    server.regenerateToken()
    const token = server.getStatus().token
    expect(token).toMatch(/\S/)            // non-empty
    expect(store.get('mcp.token')).toBe(token) // persisted, matches status
  })
})
