// shared/appdata.ts
//
// Types for the internal app-data store (src/main/appdata) — the SQLite-backed
// home for high-growth, app-owned datasets that used to live in renderer
// localStorage: AI conversations and saved queries. See
// docs/proposals/internal-app-data-store.md.

import type { AIChatMessage } from './ai-types'

export interface ConversationStats {
  totalInputTokens: number
  totalOutputTokens: number
  toolCallCount: number
}

/** A conversation row without its messages — enough to render the switcher. */
export interface ConversationSummary {
  id: string
  title: string
  stats: ConversationStats
  createdAt: number
  updatedAt: number
}

/** A conversation plus its ordered messages. */
export interface StoredConversation extends ConversationSummary {
  messages: AIChatMessage[]
}

/** The full conversation set plus which one was last active. */
export interface ConversationsSnapshot {
  conversations: StoredConversation[]
  activeConversationId: string | null
}

export interface SavedQuery {
  id: string
  name: string
  sql: string
  connectionType?: string
  /** Epoch milliseconds. */
  createdAt: number
  /** Epoch milliseconds. */
  updatedAt: number
}

/** One executed query, recorded for the History panel. Capped to the user's
 *  `general.maxHistoryItems` preference (oldest entries pruned on insert). */
export interface QueryHistoryEntry {
  id: string
  sql: string
  /** Connection the query ran against, when known. */
  connectionId?: string
  /** Driver type (postgresql/mysql/…) for the connection badge. */
  connectionType?: string
  status: 'ok' | 'error'
  /** Wall-clock duration in ms, when measured. */
  durationMs?: number
  /** Row count for successful SELECTs, when reported. */
  rowCount?: number
  /** Driver error message for failed runs. */
  error?: string
  /** Epoch milliseconds. */
  executedAt: number
}

// ─── Open-tab persistence ──────────────────────────────────────────────────
// The durable, per-tab restore-on-startup state. Owned by the tab-persistence
// engine (src/renderer/src/lib/tab-persistence) and stored one row per tab in
// the app-data SQLite `open_tabs` table, mutated incrementally via `TabOp`s so a
// single-tab edit writes a single row regardless of how many tabs are open.

/** The minimal, serialisable shape of a query tab we persist for restore. Keyed
 *  by the live tab `id` so writes can target one tab. Transient runtime state
 *  (results, execution, txn status) is intentionally dropped — restored tabs
 *  come back clean and idle. */
export interface PersistedTab {
  id: string
  title: string
  /**
   * The raw editor buffer — stored and round-tripped as **opaque text**, never
   * parsed or assumed to be SQL. A query tab is the driver-agnostic query
   * surface (its language comes from the driver's `editorLanguage` capability),
   * so this holds whatever the driver speaks: a SQL statement, a MongoDB shell
   * command, a Redis command, etc. The `sql` name matches the sibling
   * `saved_queries` / `query_history` columns (the app-wide term for "query
   * text"), not a relational assumption.
   */
  sql: string
  connectionId: string | null
  database: string | null
  schema: string | null
  savedQueryId?: string
  autoCommit: boolean
}

/** The full ordered set of persisted tabs plus which one was focused. */
export interface OpenTabsSnapshot {
  /** Ordered as they appear in the tab strip. */
  tabs: PersistedTab[]
  /** Id of the focused tab, or null (e.g. focus was on a non-persisted tab). */
  activeId: string | null
}

/**
 * One incremental mutation of the persisted tab set. The engine diffs the live
 * tabs against the last-persisted snapshot and emits the minimal op list;
 * AppDataStore applies a batch in a single transaction.
 *
 * - `upsert` — insert or update one tab's content + position.
 * - `delete` — remove one tab by id.
 * - `active` — record the focused tab id (or null).
 */
export type TabOp =
  | { kind: 'upsert'; tab: PersistedTab; position: number }
  | { kind: 'delete'; id: string }
  | { kind: 'active'; id: string | null }

