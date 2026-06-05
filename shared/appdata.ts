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
