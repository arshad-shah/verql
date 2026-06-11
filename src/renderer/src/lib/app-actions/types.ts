/**
 * App actions are named, parameterized things the AI (or any plugin) can point
 * the user to or invoke inside the renderer — navigating panels, opening tabs,
 * focusing a table, running SQL, etc. They are the single source of truth shared
 * by inline deep-link chips and agentic action tools.
 */
export type AppActionKind = 'navigation' | 'mutating'

export interface AppActionParam {
  type: 'string' | 'number' | 'boolean'
  required?: boolean
  description?: string
}

export interface AppAction {
  /** Stable id used in `verql://action/<id>` links and tool names. Built-in
   *  actions MUST use a constant from `APP_ACTION` (./ids) rather than a raw
   *  string literal; plugin actions use composite `pluginId:commandId` ids,
   *  which is why this stays a permissive `string`. */
  id: string
  /** Human label shown on chips and in the catalog. */
  title: string
  /** Shown to the AI in the system prompt so it knows when to use this. */
  description: string
  /**
   * `navigation` actions are harmless and run on click / freely from tools.
   * `mutating` actions change data and require confirmation before running.
   */
  kind: AppActionKind
  /** Optional parameter schema, surfaced to the AI. */
  params?: Record<string, AppActionParam>
  /** Performs the action in the renderer. */
  run: (params: Record<string, unknown>) => void | Promise<void>
}
