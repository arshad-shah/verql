// The "attention" seam.
//
// Some things the app does need the *user's* response while they may not be
// looking at the window — most importantly approval prompts (an AI write tool,
// an MCP query authorization). This hub is the host-owned glue that lets any
// producer announce "I need the user's attention" without knowing or caring how
// that attention is surfaced (an OS notification, a window flash, a dock badge,
// …). Surfacing is a plugin's job; see the bundled `os-notifications` plugin.
//
// The hub is deliberately tiny and delivery-agnostic. It is provided to plugins
// as a cross-plugin service (`ATTENTION_SERVICE_ID`), the same way the activity
// log is, so the orchestrator stays generic and the policy lives in a plugin.

import type { Disposable } from '../plugins/sdk/types'

/** Service id under which the host provides the `AttentionHub` to plugins. */
export const ATTENTION_SERVICE_ID = 'attention'

export type AttentionKind = 'approval' | 'alert' | 'info'

export interface AttentionRequest {
  /**
   * Stable id supplied by the producer. The same id is later passed to
   * `resolve()` so a consumer can dismiss whatever it surfaced (e.g. close an
   * OS notification once the approval has been answered).
   */
  id: string
  /** Approvals are the loud case (they block on the user); alerts/info are softer. */
  kind: AttentionKind
  title: string
  body?: string
  /** Free-form origin label, e.g. 'ai', 'mcp', or a plugin name. */
  source?: string
}

export type AttentionEvent =
  | { type: 'requested'; request: AttentionRequest }
  | { type: 'resolved'; id: string }

export type AttentionListener = (event: AttentionEvent) => void

export interface AttentionHub {
  /** Announce that the user's attention is needed. */
  request(request: AttentionRequest): void
  /** Mark a previously-requested attention as handled (or no longer relevant). */
  resolve(id: string): void
  /** Observe attention events. Returns a disposable that removes the listener. */
  subscribe(listener: AttentionListener): Disposable
}

export class AttentionHubImpl implements AttentionHub {
  private readonly listeners = new Set<AttentionListener>()
  /** Ids of requests that have been raised but not yet resolved. */
  private readonly pending = new Set<string>()

  request(request: AttentionRequest): void {
    this.pending.add(request.id)
    this.emit({ type: 'requested', request })
  }

  resolve(id: string): void {
    // Only emit for things actually outstanding so a double-resolve (e.g. a
    // timeout racing a user response) is a harmless no-op.
    if (!this.pending.delete(id)) return
    this.emit({ type: 'resolved', id })
  }

  subscribe(listener: AttentionListener): Disposable {
    this.listeners.add(listener)
    return { dispose: () => this.listeners.delete(listener) }
  }

  private emit(event: AttentionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        // A misbehaving consumer must never break the producer's flow.
        console.error('[attention] listener threw:', err)
      }
    }
  }
}
