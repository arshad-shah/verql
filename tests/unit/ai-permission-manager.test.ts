import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionManager } from '../../src/main/plugins/bundled/ai/internal/permission-manager'
import type { AITool } from '../../src/main/plugins/bundled/ai/internal/types'

function makeTool(id: string, permission: 'read' | 'write'): AITool {
  return {
    id, name: id, description: '', parameters: {},
    permission,
    execute: vi.fn(async () => ({ success: true, data: null }))
  }
}

describe('PermissionManager', () => {
  let pm: PermissionManager

  beforeEach(() => {
    pm = new PermissionManager()
  })

  it('auto-approves read tools', () => {
    expect(pm.needsApproval(makeTool('schema.list', 'read'))).toBe(false)
  })

  it('requires approval for write tools', () => {
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(true)
  })

  it('allows per-tool overrides to promote write to auto-approve', () => {
    pm.setOverride('query.execute', 'read')
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(false)
  })

  it('allows per-tool overrides to demote read to require approval', () => {
    pm.setOverride('schema.list', 'write')
    expect(pm.needsApproval(makeTool('schema.list', 'read'))).toBe(true)
  })

  it('removes override', () => {
    pm.setOverride('query.execute', 'read')
    pm.removeOverride('query.execute')
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(true)
  })

  it('tracks pending approvals', () => {
    const requestId = pm.createApprovalRequest('query.execute', { sql: 'DROP TABLE x' }, 'Run: DROP TABLE x')
    expect(pm.hasPendingApproval(requestId)).toBe(true)
  })

  it('resolves approval', async () => {
    const requestId = pm.createApprovalRequest('query.execute', {}, '')
    const promise = pm.waitForApproval(requestId)
    pm.resolveApproval(requestId, true)
    expect(await promise).toBe(true)
  })

  it('resolves rejection', async () => {
    const requestId = pm.createApprovalRequest('query.execute', {}, '')
    const promise = pm.waitForApproval(requestId)
    pm.resolveApproval(requestId, false)
    expect(await promise).toBe(false)
  })
})
