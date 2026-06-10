import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'
import { errorMessage } from '@shared/errors'
import { appActions } from './registry'
import { toast } from '@arshad-shah/cynosure-react/toast'

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

  window.electronAPI.on(IPC_EVENTS.APP_ACTION_PERFORM, async (payload: unknown) => {
    const p = payload as { requestId?: string; actionId?: string; params?: Record<string, unknown> } | undefined
    if (!p?.requestId || !p.actionId) return

    const report = (success: boolean, error?: string) => {
      void window.electronAPI.invoke(IPC_CHANNELS.APP_ACTION_RESULT, {
        requestId: p.requestId!, success, ...(error ? { error } : {})
      })
    }

    const action = appActions.get(p.actionId)
    if (!action) {
      report(false, `Unknown action: ${p.actionId}`)
      return
    }
    // Only safe navigation actions run agentically; mutating actions must be
    // user-confirmed via a chip, never auto-run from a tool.
    if (action.kind !== 'navigation') {
      report(false, `"${action.title}" changes data and needs the user to confirm it.`)
      return
    }

    try {
      await appActions.run(p.actionId, p.params ?? {})
      report(true)
    } catch (err) {
      const message = errorMessage(err)
      report(false, message)
      toast.error(`Couldn't ${action.title.toLowerCase()}`, { description: message })
    }
  })
}
