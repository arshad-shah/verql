// The AI permission manager and the MCP server must share ONE write-gating
// decision. They previously each re-implemented it, which is how the MCP
// explain-write guard ended up missing on the AI side. This pins the shared
// predicate both now delegate to.
import { describe, it, expect } from 'vitest'
import { isWriteToolCall } from '../../../src/main/plugins/sdk/tool-schema'

describe('isWriteToolCall (shared gating)', () => {
  it('treats write-permission calls as writes regardless of params', () => {
    expect(isWriteToolCall('write', {})).toBe(true)
    expect(isWriteToolCall('write', undefined)).toBe(true)
    expect(isWriteToolCall('write', { sql: 'SELECT 1' })).toBe(true)
  })

  it('treats a read call with write SQL as a write', () => {
    expect(isWriteToolCall('read', { sql: 'EXPLAIN ANALYZE DELETE FROM t' })).toBe(true)
    expect(isWriteToolCall('read', { sql: 'SELECT 1; DROP TABLE t' })).toBe(true)
  })

  it('treats a genuine read as a read', () => {
    expect(isWriteToolCall('read', { sql: 'SELECT * FROM t' })).toBe(false)
    expect(isWriteToolCall('read', {})).toBe(false)
    expect(isWriteToolCall('read', undefined)).toBe(false)
  })
})
