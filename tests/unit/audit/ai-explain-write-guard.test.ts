// Security regression: the AI tool-call loop must apply the same
// content-based write detection the MCP server already does
// (mcp-explain-write-guard). A `read`-permission tool such as
// `explain_query` can still execute writes when its SQL is itself a write:
//   - explain_query({ sql: 'EXPLAIN ANALYZE DELETE FROM users' })  (Postgres runs the DELETE)
//   - explain_query({ sql: 'SELECT 1; DROP TABLE users' })          (multi-statement)
//
// The MCP path guards this via `needsApprovalForCall(tool, params)`. The AI
// `PermissionManager` only looked at `tool.permission`, so these slipped
// through with no approval — even in `ask-write`, and unblocked in
// `read-only`. The guard now inspects the `sql` param for read tools too.
import { describe, it, expect } from 'vitest'
import { PermissionManager } from '../../../src/main/plugins/bundled/ai/internal/permission-manager'
import type { Tool } from '../../../src/main/plugins/sdk/types'

const readTool = { id: 'explain_query', name: 'explain_query', permission: 'read' } as Tool
const pureRead = { sql: 'SELECT * FROM users' }
const sneakyWrite = { sql: 'EXPLAIN ANALYZE DELETE FROM users' }
const multiWrite = { sql: 'SELECT 1; DROP TABLE users' }

describe('AI PermissionManager — content-based write detection', () => {
  it('requires approval for a read tool whose SQL is actually a write (ask-write)', () => {
    const pm = new PermissionManager()
    pm.setProfile('ask-write')
    expect(pm.needsApproval(readTool, pureRead)).toBe(false)
    expect(pm.needsApproval(readTool, sneakyWrite)).toBe(true)
    expect(pm.needsApproval(readTool, multiWrite)).toBe(true)
  })

  it('blocks a read tool whose SQL is a write under read-only', () => {
    const pm = new PermissionManager()
    pm.setProfile('read-only')
    expect(pm.isWriteBlocked(readTool, pureRead)).toBe(false)
    expect(pm.isWriteBlocked(readTool, sneakyWrite)).toBe(true)
  })

  it('does not regress genuine write tools', () => {
    const writeTool = { id: 'query', name: 'query', permission: 'write' } as Tool
    const pm = new PermissionManager()
    pm.setProfile('ask-write')
    expect(pm.needsApproval(writeTool, { sql: 'SELECT 1' })).toBe(true)
    pm.setProfile('read-only')
    expect(pm.isWriteBlocked(writeTool, { sql: 'SELECT 1' })).toBe(true)
  })

  it('auto profile still skips approval (documented behaviour)', () => {
    const pm = new PermissionManager()
    pm.setProfile('auto')
    expect(pm.needsApproval(readTool, sneakyWrite)).toBe(false)
  })
})
