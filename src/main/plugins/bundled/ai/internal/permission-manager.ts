import { randomUUID } from 'crypto'
import type { Tool } from '../../../sdk/types'

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

  needsApproval(tool: Tool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    return effective === 'write'
  }

  setOverride(toolId: string, permission: 'read' | 'write'): void {
    this.overrides.set(toolId, permission)
  }

  removeOverride(toolId: string): void {
    this.overrides.delete(toolId)
  }

  createApprovalRequest(
    toolId: string,
    params: Record<string, unknown>,
    display: string
  ): string {
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
      if (!entry) {
        resolve(false)
        return
      }
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
