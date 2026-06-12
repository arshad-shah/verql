import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import type { AIChatMessage } from '@shared/ai-types'
import type {
  ConversationStats,
  ConversationsSnapshot,
  StoredConversation,
  SavedQuery,
  QueryHistoryEntry,
  OpenTabsSnapshot,
  PersistedTab,
  TabOp,
} from '@shared/appdata'

const EMPTY_STATS: ConversationStats = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  toolCallCount: 0,
}

// Forward-only schema migrations, keyed on PRAGMA user_version. The index in
// this array is the version it upgrades *to* minus one: MIGRATIONS[0] takes a
// fresh (version 0) DB to version 1, and so on. Never reorder or rewrite an
// existing entry — only append.
const MIGRATIONS: ((db: Database.Database) => void)[] = [
  /* v1 */ (db) => {
    db.exec(`
      CREATE TABLE conversations (
        id                   TEXT PRIMARY KEY,
        title                TEXT NOT NULL,
        created_at           INTEGER NOT NULL,
        updated_at           INTEGER NOT NULL,
        total_input_tokens   INTEGER NOT NULL DEFAULT 0,
        total_output_tokens  INTEGER NOT NULL DEFAULT 0,
        tool_call_count      INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

      CREATE TABLE messages (
        id               TEXT PRIMARY KEY,
        conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        seq              INTEGER NOT NULL,
        role             TEXT NOT NULL,
        content          TEXT NOT NULL,
        timestamp        INTEGER NOT NULL,
        extra            TEXT
      );
      CREATE INDEX idx_messages_conversation ON messages(conversation_id, seq);

      CREATE TABLE saved_queries (
        id               TEXT PRIMARY KEY,
        name             TEXT NOT NULL,
        sql              TEXT NOT NULL,
        connection_type  TEXT,
        created_at       INTEGER NOT NULL,
        updated_at       INTEGER NOT NULL
      );
      CREATE INDEX idx_saved_queries_updated_at ON saved_queries(updated_at DESC);

      CREATE TABLE meta (
        key    TEXT PRIMARY KEY,
        value  TEXT
      );
    `)
  },
  /* v2 */ (db) => {
    db.exec(`
      CREATE TABLE query_history (
        id               TEXT PRIMARY KEY,
        sql              TEXT NOT NULL,
        connection_id    TEXT,
        connection_type  TEXT,
        status           TEXT NOT NULL,
        duration_ms      INTEGER,
        row_count        INTEGER,
        error            TEXT,
        executed_at      INTEGER NOT NULL
      );
      CREATE INDEX idx_query_history_executed_at ON query_history(executed_at DESC);
    `)
  },
  /* v3 */ (db) => {
    db.exec(`
      CREATE TABLE open_tabs (
        id              TEXT PRIMARY KEY,
        position        INTEGER NOT NULL,
        title           TEXT NOT NULL,
        -- Opaque editor buffer for any driver's query language (SQL, Mongo,
        -- Redis, ...), never parsed here. The sql name mirrors the
        -- saved_queries/query_history columns; not a relational assumption.
        sql             TEXT NOT NULL,
        connection_id   TEXT,
        db_name         TEXT,
        schema_name     TEXT,
        saved_query_id  TEXT,
        auto_commit     INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_open_tabs_position ON open_tabs(position);
    `)
  },
]

const ACTIVE_CONVERSATION_KEY = 'activeConversationId'
const ACTIVE_TAB_KEY = 'activeTabId'

// Fields of AIChatMessage that live in the `extra` JSON column. The hot columns
// (role, content, timestamp, ordering) are native; everything else rides along
// as JSON so the message shape can evolve without a schema migration.
interface MessageExtra {
  toolCalls?: AIChatMessage['toolCalls']
  toolCallId?: AIChatMessage['toolCallId']
  isError?: AIChatMessage['isError']
}

/**
 * The app's internal SQLite store. Owns durable, app-owned datasets (AI
 * conversations, saved queries) that outgrew renderer localStorage. Mirrors
 * the ConfigStore pattern: a main-process class wrapping a file, opened once
 * at boot and reached through IPC. Synchronous (better-sqlite3) — every
 * statement here is small and indexed.
 */
export class AppDataStore {
  private db: Database.Database

  constructor(filePath: string) {
    if (filePath !== ':memory:') {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    }
    try {
      this.db = this.open(filePath)
    } catch (err) {
      // A corrupt or unreadable DB must not crash-loop app boot. Quarantine the
      // file aside (so it can be inspected/recovered) and start fresh. Callers
      // see an empty store; the renderer surfaces this via the normal empty UI.
      if (filePath === ':memory:') throw err
      console.error('[appdata] Failed to open app.db; quarantining and recreating:', err)
      try {
        fs.renameSync(filePath, `${filePath}.corrupt-${Date.now()}`)
      } catch { /* best effort — fall through to a fresh open */ }
      this.db = this.open(filePath)
    }
  }

  private open(filePath: string): Database.Database {
    const db = new Database(filePath)
    // WAL: concurrent reads during writes and crash-safe commits. foreign_keys:
    // make `ON DELETE CASCADE` on messages actually fire.
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    const current = db.pragma('user_version', { simple: true }) as number
    for (let v = current; v < MIGRATIONS.length; v++) {
      const run = db.transaction(() => {
        MIGRATIONS[v](db)
        db.pragma(`user_version = ${v + 1}`)
      })
      run()
    }
    return db
  }

  close(): void {
    this.db.close()
  }

  // ─── Conversations ────────────────────────────────────────────────
  listConversations(): ConversationsSnapshot {
    const rows = this.db
      .prepare(
        `SELECT id, title, created_at, updated_at,
                total_input_tokens, total_output_tokens, tool_call_count
         FROM conversations ORDER BY updated_at DESC`,
      )
      .all() as Array<{
      id: string
      title: string
      created_at: number
      updated_at: number
      total_input_tokens: number
      total_output_tokens: number
      tool_call_count: number
    }>

    const msgStmt = this.db.prepare(
      `SELECT id, role, content, timestamp, extra
       FROM messages WHERE conversation_id = ? ORDER BY seq`,
    )

    const conversations: StoredConversation[] = rows.map((r) => {
      const messageRows = msgStmt.all(r.id) as Array<{
        id: string
        role: string
        content: string
        timestamp: number
        extra: string | null
      }>
      const messages: AIChatMessage[] = messageRows.map((m) => {
        const extra = (m.extra ? JSON.parse(m.extra) : {}) as MessageExtra
        const msg: AIChatMessage = {
          id: m.id,
          role: m.role as AIChatMessage['role'],
          content: m.content,
          timestamp: m.timestamp,
        }
        if (extra.toolCalls) msg.toolCalls = extra.toolCalls
        if (extra.toolCallId) msg.toolCallId = extra.toolCallId
        if (extra.isError) msg.isError = extra.isError
        return msg
      })
      return {
        id: r.id,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        stats: {
          totalInputTokens: r.total_input_tokens,
          totalOutputTokens: r.total_output_tokens,
          toolCallCount: r.tool_call_count,
        },
        messages,
      }
    })

    return { conversations, activeConversationId: this.getActiveConversationId() }
  }

  /** Replace a conversation and all its messages atomically. */
  upsertConversation(c: StoredConversation): void {
    const stats = c.stats ?? EMPTY_STATS
    const run = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO conversations
             (id, title, created_at, updated_at,
              total_input_tokens, total_output_tokens, tool_call_count)
           VALUES (@id, @title, @createdAt, @updatedAt, @inTok, @outTok, @toolCalls)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             updated_at = excluded.updated_at,
             total_input_tokens = excluded.total_input_tokens,
             total_output_tokens = excluded.total_output_tokens,
             tool_call_count = excluded.tool_call_count`,
        )
        .run({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          inTok: stats.totalInputTokens,
          outTok: stats.totalOutputTokens,
          toolCalls: stats.toolCallCount,
        })

      // Messages are append-only in practice but compaction/branching can
      // rewrite history, so replace the set wholesale within the transaction.
      this.db.prepare(`DELETE FROM messages WHERE conversation_id = ?`).run(c.id)
      const insert = this.db.prepare(
        `INSERT INTO messages (id, conversation_id, seq, role, content, timestamp, extra)
         VALUES (@id, @convId, @seq, @role, @content, @timestamp, @extra)`,
      )
      c.messages.forEach((m, seq) => {
        const extra: MessageExtra = {}
        if (m.toolCalls) extra.toolCalls = m.toolCalls
        if (m.toolCallId) extra.toolCallId = m.toolCallId
        if (m.isError) extra.isError = m.isError
        const hasExtra = Object.keys(extra).length > 0
        insert.run({
          id: m.id,
          convId: c.id,
          seq,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          extra: hasExtra ? JSON.stringify(extra) : null,
        })
      })
    })
    run()
  }

  deleteConversation(id: string): void {
    // ON DELETE CASCADE removes the conversation's messages.
    this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id)
    if (this.getActiveConversationId() === id) this.setActiveConversationId(null)
  }

  getActiveConversationId(): string | null {
    const row = this.db
      .prepare(`SELECT value FROM meta WHERE key = ?`)
      .get(ACTIVE_CONVERSATION_KEY) as { value: string | null } | undefined
    return row?.value ?? null
  }

  setActiveConversationId(id: string | null): void {
    this.db
      .prepare(
        `INSERT INTO meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(ACTIVE_CONVERSATION_KEY, id)
  }

  /** Bulk import for the one-time localStorage migration. No-op if non-empty. */
  importConversations(conversations: StoredConversation[], activeId: string | null): number {
    const count = this.db.prepare(`SELECT COUNT(*) AS n FROM conversations`).get() as { n: number }
    if (count.n > 0) return 0
    const run = this.db.transaction(() => {
      for (const c of conversations) this.upsertConversation(c)
      if (activeId) this.setActiveConversationId(activeId)
    })
    run()
    return conversations.length
  }

  // ─── Saved queries ────────────────────────────────────────────────
  listSavedQueries(): SavedQuery[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, sql, connection_type, created_at, updated_at
         FROM saved_queries ORDER BY updated_at DESC`,
      )
      .all() as Array<{
      id: string
      name: string
      sql: string
      connection_type: string | null
      created_at: number
      updated_at: number
    }>
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sql: r.sql,
      ...(r.connection_type ? { connectionType: r.connection_type } : {}),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  upsertSavedQuery(q: SavedQuery): void {
    this.db
      .prepare(
        `INSERT INTO saved_queries (id, name, sql, connection_type, created_at, updated_at)
         VALUES (@id, @name, @sql, @connectionType, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           sql = excluded.sql,
           connection_type = excluded.connection_type,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: q.id,
        name: q.name,
        sql: q.sql,
        connectionType: q.connectionType ?? null,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })
  }

  deleteSavedQuery(id: string): void {
    this.db.prepare(`DELETE FROM saved_queries WHERE id = ?`).run(id)
  }

  importSavedQueries(queries: SavedQuery[]): number {
    const count = this.db.prepare(`SELECT COUNT(*) AS n FROM saved_queries`).get() as { n: number }
    if (count.n > 0) return 0
    const run = this.db.transaction(() => {
      for (const q of queries) this.upsertSavedQuery(q)
    })
    run()
    return queries.length
  }

  // ─── Query history ────────────────────────────────────────────────
  /** Newest-first list of recorded query runs, capped to `limit`. */
  listQueryHistory(limit = 500): QueryHistoryEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, sql, connection_id, connection_type, status,
                duration_ms, row_count, error, executed_at
         FROM query_history ORDER BY executed_at DESC LIMIT ?`,
      )
      .all(limit) as Array<{
      id: string
      sql: string
      connection_id: string | null
      connection_type: string | null
      status: string
      duration_ms: number | null
      row_count: number | null
      error: string | null
      executed_at: number
    }>
    return rows.map((r) => ({
      id: r.id,
      sql: r.sql,
      ...(r.connection_id ? { connectionId: r.connection_id } : {}),
      ...(r.connection_type ? { connectionType: r.connection_type } : {}),
      status: r.status as QueryHistoryEntry['status'],
      ...(r.duration_ms != null ? { durationMs: r.duration_ms } : {}),
      ...(r.row_count != null ? { rowCount: r.row_count } : {}),
      ...(r.error ? { error: r.error } : {}),
      executedAt: r.executed_at,
    }))
  }

  /** Insert one run and prune to the newest `maxItems` in a single transaction. */
  addQueryHistory(entry: QueryHistoryEntry, maxItems: number): void {
    const run = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO query_history
             (id, sql, connection_id, connection_type, status,
              duration_ms, row_count, error, executed_at)
           VALUES (@id, @sql, @connectionId, @connectionType, @status,
                   @durationMs, @rowCount, @error, @executedAt)`,
        )
        .run({
          id: entry.id,
          sql: entry.sql,
          connectionId: entry.connectionId ?? null,
          connectionType: entry.connectionType ?? null,
          status: entry.status,
          durationMs: entry.durationMs ?? null,
          rowCount: entry.rowCount ?? null,
          error: entry.error ?? null,
          executedAt: entry.executedAt,
        })
      // Keep only the newest `maxItems`. Clamp to >= 1 so a misconfigured 0
      // doesn't wipe the table on every insert.
      const keep = Math.max(1, Math.floor(maxItems))
      this.db
        .prepare(
          `DELETE FROM query_history WHERE id NOT IN (
             SELECT id FROM query_history ORDER BY executed_at DESC LIMIT ?
           )`,
        )
        .run(keep)
    })
    run()
  }

  deleteQueryHistory(id: string): void {
    this.db.prepare(`DELETE FROM query_history WHERE id = ?`).run(id)
  }

  clearQueryHistory(): void {
    this.db.prepare(`DELETE FROM query_history`).run()
  }

  // ─── Open tabs ────────────────────────────────────────────────────
  /** The ordered set of persisted tabs plus the focused id. */
  listOpenTabs(): OpenTabsSnapshot {
    const rows = this.db
      .prepare(
        `SELECT id, title, sql, connection_id, db_name, schema_name, saved_query_id, auto_commit
         FROM open_tabs ORDER BY position ASC`,
      )
      .all() as Array<{
      id: string
      title: string
      sql: string
      connection_id: string | null
      db_name: string | null
      schema_name: string | null
      saved_query_id: string | null
      auto_commit: number
    }>
    const tabs: PersistedTab[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      sql: r.sql,
      connectionId: r.connection_id,
      database: r.db_name,
      schema: r.schema_name,
      ...(r.saved_query_id ? { savedQueryId: r.saved_query_id } : {}),
      autoCommit: r.auto_commit !== 0,
    }))
    return { tabs, activeId: this.getActiveTabId() }
  }

  /**
   * Apply a batch of incremental tab mutations in a single transaction. The
   * renderer's persistence engine diffs the live tabs against the last-persisted
   * snapshot and sends only what changed — typically a single `upsert` when the
   * user edits one tab's SQL — so write cost is bounded by the change, not by
   * how many tabs are open.
   */
  applyOpenTabOps(ops: TabOp[]): void {
    if (ops.length === 0) return
    const upsert = this.db.prepare(
      `INSERT INTO open_tabs
         (id, position, title, sql, connection_id, db_name, schema_name, saved_query_id, auto_commit)
       VALUES (@id, @position, @title, @sql, @connectionId, @database, @schema, @savedQueryId, @autoCommit)
       ON CONFLICT(id) DO UPDATE SET
         position = excluded.position,
         title = excluded.title,
         sql = excluded.sql,
         connection_id = excluded.connection_id,
         db_name = excluded.db_name,
         schema_name = excluded.schema_name,
         saved_query_id = excluded.saved_query_id,
         auto_commit = excluded.auto_commit`,
    )
    const del = this.db.prepare(`DELETE FROM open_tabs WHERE id = ?`)
    const run = this.db.transaction(() => {
      for (const op of ops) {
        if (op.kind === 'upsert') {
          upsert.run({
            id: op.tab.id,
            position: op.position,
            title: op.tab.title,
            sql: op.tab.sql,
            connectionId: op.tab.connectionId,
            database: op.tab.database,
            schema: op.tab.schema,
            savedQueryId: op.tab.savedQueryId ?? null,
            autoCommit: op.tab.autoCommit ? 1 : 0,
          })
        } else if (op.kind === 'delete') {
          del.run(op.id)
        } else {
          this.setActiveTabId(op.id)
        }
      }
    })
    run()
  }

  private getActiveTabId(): string | null {
    const row = this.db
      .prepare(`SELECT value FROM meta WHERE key = ?`)
      .get(ACTIVE_TAB_KEY) as { value: string | null } | undefined
    return row?.value ?? null
  }

  private setActiveTabId(id: string | null): void {
    this.db
      .prepare(
        `INSERT INTO meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(ACTIVE_TAB_KEY, id)
  }
}
