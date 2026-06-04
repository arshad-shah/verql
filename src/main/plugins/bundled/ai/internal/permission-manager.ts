import { randomUUID } from 'crypto'
import type { Tool } from '../../../sdk/types'
import { isWriteQuery } from '../../../sdk/tool-schema'

export type PermissionProfile = 'read-only' | 'ask-write' | 'auto'

interface PendingApproval {
  requestId: string
  toolId: string
  params: Record<string, unknown>
  display: string
  resolve: (approved: boolean) => void
}

export class PermissionManager {
  private overrides = new Map<string, 'read' | 'write'>()
  private pending = new Map<string, PendingApproval>()
  private profile: PermissionProfile = 'ask-write'

  getProfile(): PermissionProfile {
    return this.profile
  }

  setProfile(p: PermissionProfile): void {
    this.profile = p
  }

  /**
   * Resolve the effective write-ness of a call. A tool is a write if its
   * (possibly overridden) declared permission is `write`, OR — mirroring the
   * MCP server's `needsApprovalForCall` — if it's a `read` tool whose `sql`
   * param is itself a write/DDL statement. Without the content check, a
   * `read` tool like `explain_query` can smuggle `EXPLAIN ANALYZE DELETE …`
   * or `SELECT 1; DROP …` past the permission gate.
   */
  private isEffectiveWrite(tool: Tool, params?: Record<string, unknown>): boolean {
    const declared = this.overrides.get(tool.id) ?? tool.permission
    if (declared === 'write') return true
    const sql = params && typeof params.sql === 'string' ? params.sql : ''
    return sql ? isWriteQuery(sql) : false
  }

  /**
   * True only when the active profile refuses write tools outright (read-only).
   * Callers should short-circuit before opening an approval prompt and return
   * a blocked-write error to the model so it surfaces in the transcript.
   */
  isWriteBlocked(tool: Tool, params?: Record<string, unknown>): boolean {
    return this.profile === 'read-only' && this.isEffectiveWrite(tool, params)
  }

  needsApproval(tool: Tool, params?: Record<string, unknown>): boolean {
    if (this.profile === 'auto') return false
    if (this.profile === 'read-only') return false
    return this.isEffectiveWrite(tool, params)
  }

  setOverride(toolId: string, permission: 'read' | 'write'): void {
    this.overrides.set(toolId, permission)
  }

  removeOverride(toolId: string): void {
    this.overrides.delete(toolId)
  }

  createApprovalRequest(toolId: string, params: Record<string, unknown>, display: string): string {
    const requestId = randomUUID()
    this.pending.set(requestId, { requestId, toolId, params, display, resolve: () => {} })
    return requestId
  }

  hasPendingApproval(requestId: string): boolean {
    return this.pending.has(requestId)
  }

  waitForApproval(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const entry = this.pending.get(requestId)
      if (!entry) { resolve(false); return }
      entry.resolve = resolve
    })
  }

  resolveApproval(requestId: string, approved: boolean): void {
    const entry = this.pending.get(requestId)
    if (entry) {
      entry.resolve(approved)
      this.pending.delete(requestId)
    }
  }
}
