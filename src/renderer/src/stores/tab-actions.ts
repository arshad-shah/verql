/**
 * Tab-actions registry.
 *
 * Any tab kind that can be saved or has unsaved state registers itself here
 * on mount. The host shell (App.tsx) uses the registry to:
 *   - route the global Cmd/Ctrl+S to the active tab's save handler, so save
 *     works regardless of which tab type is in front (query, settings, …)
 *   - check `isDirty()` before closing a tab so the user gets a confirm
 *     dialog instead of silently losing edits
 *
 * Refs (not zustand state) because tab handlers re-bind on every render and
 * we don't want every tab to re-render when a sibling registers or saves.
 * Subscribers (the close-button, the palette) call `get(tabId)` on demand.
 *
 * The `usePendingClose` hook is the one bit of zustand state: a single
 * pending-close tab id that App.tsx watches to drive the confirm dialog.
 */
import { create } from 'zustand'

export interface TabActions {
  /** Persist the tab's content. Receives no args — implementations read their own state. */
  onSave?: () => void | Promise<void>
  /** Returns true when the tab has unsaved changes. Drives the dirty dot and the close confirm. */
  isDirty?: () => boolean
  /** Optional human description for confirm dialogs ("Query 1", "Settings", …). */
  label?: string
  /** Run a single SQL statement (CodeLens "▶ Run"). */
  runStatement?: (sql: string) => void
  /** Show EXPLAIN ANALYZE plan for a single statement (CodeLens "Explain"). */
  explainStatement?: (sql: string) => void
  /** Returns 'active' when the tab has an open, uncommitted transaction. */
  txnStatus?: () => 'none' | 'active'
  commitTransaction?: () => void | Promise<void>
  rollbackTransaction?: () => void | Promise<void>
}

const handlers = new Map<string, TabActions>()

export const tabActions = {
  register(tabId: string, actions: TabActions): void {
    handlers.set(tabId, actions)
  },
  unregister(tabId: string): void {
    handlers.delete(tabId)
  },
  get(tabId: string): TabActions | undefined {
    return handlers.get(tabId)
  },

  /** Returns true if the tab is registered and reports itself dirty. */
  isDirty(tabId: string): boolean {
    return Boolean(handlers.get(tabId)?.isDirty?.())
  },

  /** Invokes the tab's save handler. No-op when the tab didn't register one. */
  async save(tabId: string): Promise<void> {
    const a = handlers.get(tabId)
    if (a?.onSave) await a.onSave()
  },

  runStatement(tabId: string, sql: string): void {
    handlers.get(tabId)?.runStatement?.(sql)
  },
  explainStatement(tabId: string, sql: string): void {
    handlers.get(tabId)?.explainStatement?.(sql)
  },

  hasOpenTransaction(tabId: string): boolean {
    return handlers.get(tabId)?.txnStatus?.() === 'active'
  },
  async commitTransaction(tabId: string): Promise<void> {
    await handlers.get(tabId)?.commitTransaction?.()
  },
  async rollbackTransaction(tabId: string): Promise<void> {
    await handlers.get(tabId)?.rollbackTransaction?.()
  },
}

interface PendingCloseState {
  pendingId: string | null
  request: (tabId: string) => void
  clear: () => void
}

/**
 * Holds the id of a tab the user has asked to close but for which we're
 * still awaiting "discard changes" confirmation. The App watches this and
 * mounts the dialog; the tab-bar and Cmd+W path go through `request()` so
 * every close site shares the same dirty-check.
 */
export const usePendingClose = create<PendingCloseState>((set) => ({
  pendingId: null,
  request: (tabId) => set({ pendingId: tabId }),
  clear: () => set({ pendingId: null }),
}))

/**
 * Routes through the registry: if the tab is dirty, raises the confirm
 * dialog; otherwise calls the supplied `actuallyClose` synchronously. The
 * caller passes the real close action so this helper stays decoupled from
 * the tabs store (which would otherwise create an import cycle).
 */
export function requestCloseTab(tabId: string, actuallyClose: (id: string) => void): void {
  if (tabActions.isDirty(tabId) || tabActions.hasOpenTransaction(tabId)) {
    usePendingClose.getState().request(tabId)
  } else {
    actuallyClose(tabId)
  }
}
