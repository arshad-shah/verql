import { randomUUID } from 'crypto'
import type { Tool } from '../../../sdk/types'

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
   * True only when the active profile refuses write tools outright (read-only).
   * Callers should short-circuit before opening an approval prompt and return
   * a blocked-write error to the model so it surfaces in the transcript.
   */
  isWriteBlocked(tool: Tool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    return this.profile === 'read-only' && effective === 'write'
  }

  needsApproval(tool: Tool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    if (this.profile === 'auto') return false
    if (this.profile === 'read-only') return false
    return effective === 'write'
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
