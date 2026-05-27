import { IPC_EVENTS } from '@shared/ipc'
import { appActions } from './registry'
import { useToastStore } from '@/stores/toast'

let initialized = false

/**
 * Bridges agentic `perform_app_action` tool calls (main process) to the
 * renderer's App-Action registry. Only `navigation` actions run agentically;
 * `mutating` actions must be confirmed by the user via a chip, never auto-run
 * from a tool. Call once at startup.
 */
export function initAppActionBridge(): void {
  if (initialized) return
  if (typeof window === 'undefined' || !window.electronAPI) return
  initialized = true

  window.electronAPI.on(IPC_EVENTS.APP_ACTION_PERFORM, (payload: unknown) => {
    const p = payload as { actionId?: string; params?: Record<string, unknown> } | undefined
    if (!p?.actionId) return
    const action = appActions.get(p.actionId)
    if (!action || action.kind !== 'navigation') return
    // Fire-and-forget, but surface failures: an agentic action that throws
    // (e.g. opening an ER diagram with no live connection) otherwise vanishes.
    Promise.resolve(appActions.run(p.actionId, p.params ?? {})).catch((err) => {
      useToastStore.getState().addToast({
        type: 'error',
        title: `Couldn't ${action.title.toLowerCase()}`,
        message: err instanceof Error ? err.message : String(err)
      })
    })
  })
}
