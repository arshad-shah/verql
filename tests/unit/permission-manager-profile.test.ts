import { describe, it, expect } from 'vitest'
import { PermissionManager } from '../../src/main/plugins/bundled/ai/internal/permission-manager'

const writeTool = {
  id: 'run_query',
  name: 'run_query',
  description: '',
  permission: 'write' as const,
  run: async () => undefined,
}
const readTool = {
  id: 'describe_table',
  name: 'describe_table',
  description: '',
  permission: 'read' as const,
  run: async () => undefined,
}

describe('PermissionManager profile', () => {
  it('defaults to ask-write', () => {
    const pm = new PermissionManager()
    expect(pm.getProfile()).toBe('ask-write')
  })

  it('ask-write requires approval for write tools and not for read tools', () => {
    const pm = new PermissionManager()
    expect(pm.needsApproval(writeTool)).toBe(true)
    expect(pm.needsApproval(readTool)).toBe(false)
  })

  it('auto never requires approval', () => {
    const pm = new PermissionManager()
    pm.setProfile('auto')
    expect(pm.needsApproval(writeTool)).toBe(false)
    expect(pm.needsApproval(readTool)).toBe(false)
  })

  it('read-only refuses write tools via isWriteBlocked', () => {
    const pm = new PermissionManager()
    pm.setProfile('read-only')
    expect(pm.isWriteBlocked(writeTool)).toBe(true)
    expect(pm.isWriteBlocked(readTool)).toBe(false)
    // read-only never needs approval — writes never even reach the prompt path.
    expect(pm.needsApproval(writeTool)).toBe(false)
  })
})
