import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AppDataStore } from '../../src/main/appdata/store'
import type { StoredConversation, SavedQuery, QueryHistoryEntry } from '../../shared/appdata'
import type { AIChatMessage } from '../../shared/ai-types'

function conv(id: string, messages: AIChatMessage[] = []): StoredConversation {
  const now = Date.now()
  return {
    id,
    title: `conv ${id}`,
    createdAt: now,
    updatedAt: now,
    stats: { totalInputTokens: 1, totalOutputTokens: 2, toolCallCount: 3 },
    messages,
  }
}

function msg(id: string, over: Partial<AIChatMessage> = {}): AIChatMessage {
  return { id, role: 'user', content: `m ${id}`, timestamp: Date.now(), ...over }
}

describe('AppDataStore', () => {
  let store: AppDataStore

  beforeEach(() => {
    store = new AppDataStore(':memory:')
  })

  afterEach(() => {
    store.close()
  })

  describe('conversations', () => {
    it('starts empty', () => {
      const snap = store.listConversations()
      expect(snap.conversations).toEqual([])
      expect(snap.activeConversationId).toBeNull()
    })

    it('upserts a conversation with its messages', () => {
      store.upsertConversation(conv('a', [msg('m1'), msg('m2', { role: 'assistant' })]))
      const { conversations } = store.listConversations()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].id).toBe('a')
      expect(conversations[0].messages.map((m) => m.id)).toEqual(['m1', 'm2'])
      expect(conversations[0].messages[1].role).toBe('assistant')
      expect(conversations[0].stats).toEqual({ totalInputTokens: 1, totalOutputTokens: 2, toolCallCount: 3 })
    })

    it('preserves message order via seq', () => {
      const messages = ['z', 'a', 'm', 'b'].map((id) => msg(id))
      store.upsertConversation(conv('a', messages))
      const { conversations } = store.listConversations()
      expect(conversations[0].messages.map((m) => m.id)).toEqual(['z', 'a', 'm', 'b'])
    })

    it('round-trips structured message extras (toolCalls, toolCallId, isError)', () => {
      const withTool = msg('m1', {
        role: 'assistant',
        toolCalls: [{ id: 't1', name: 'run_query', arguments: '{"sql":"SELECT 1"}' }],
      })
      const toolResult = msg('m2', { role: 'tool', toolCallId: 't1' })
      const errored = msg('m3', { role: 'assistant', isError: true })
      store.upsertConversation(conv('a', [withTool, toolResult, errored]))
      const { conversations } = store.listConversations()
      const [a, b, c] = conversations[0].messages
      expect(a.toolCalls).toEqual([{ id: 't1', name: 'run_query', arguments: '{"sql":"SELECT 1"}' }])
      expect(b.toolCallId).toBe('t1')
      expect(c.isError).toBe(true)
      // Plain messages carry no extras
      expect(b.toolCalls).toBeUndefined()
    })

    it('replaces messages on re-upsert (compaction/branch rewrite)', () => {
      store.upsertConversation(conv('a', [msg('m1'), msg('m2'), msg('m3')]))
      store.upsertConversation(conv('a', [msg('summary', { role: 'system' }), msg('m3')]))
      const { conversations } = store.listConversations()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].messages.map((m) => m.id)).toEqual(['summary', 'm3'])
    })

    it('deletes a conversation and cascades its messages', () => {
      store.upsertConversation(conv('a', [msg('m1')]))
      store.upsertConversation(conv('b', [msg('m2')]))
      store.deleteConversation('a')
      const { conversations } = store.listConversations()
      expect(conversations.map((c) => c.id)).toEqual(['b'])
    })

    it('orders conversations by updated_at descending', () => {
      const older = conv('old')
      older.updatedAt = 1000
      const newer = conv('new')
      newer.updatedAt = 2000
      store.upsertConversation(older)
      store.upsertConversation(newer)
      const { conversations } = store.listConversations()
      expect(conversations.map((c) => c.id)).toEqual(['new', 'old'])
    })

    it('persists and clears the active conversation id', () => {
      store.upsertConversation(conv('a'))
      store.setActiveConversationId('a')
      expect(store.listConversations().activeConversationId).toBe('a')
      store.setActiveConversationId(null)
      expect(store.listConversations().activeConversationId).toBeNull()
    })

    it('clears active id when the active conversation is deleted', () => {
      store.upsertConversation(conv('a'))
      store.setActiveConversationId('a')
      store.deleteConversation('a')
      expect(store.listConversations().activeConversationId).toBeNull()
    })
  })

  describe('conversation import (migration)', () => {
    it('imports into an empty store and records the active id', () => {
      const imported = store.importConversations([conv('a'), conv('b')], 'b')
      expect(imported).toBe(2)
      const snap = store.listConversations()
      expect(snap.conversations).toHaveLength(2)
      expect(snap.activeConversationId).toBe('b')
    })

    it('is a no-op when conversations already exist (idempotent)', () => {
      store.upsertConversation(conv('existing'))
      const imported = store.importConversations([conv('a'), conv('b')], 'a')
      expect(imported).toBe(0)
      expect(store.listConversations().conversations.map((c) => c.id)).toEqual(['existing'])
    })
  })

  describe('saved queries', () => {
    const sq = (id: string, over: Partial<SavedQuery> = {}): SavedQuery => ({
      id,
      name: `q ${id}`,
      sql: 'SELECT 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...over,
    })

    it('starts empty', () => {
      expect(store.listSavedQueries()).toEqual([])
    })

    it('upserts and updates in place', () => {
      store.upsertSavedQuery(sq('a', { name: 'first', connectionType: 'postgresql' }))
      store.upsertSavedQuery(sq('a', { name: 'renamed', sql: 'SELECT 2' }))
      const list = store.listSavedQueries()
      expect(list).toHaveLength(1)
      expect(list[0].name).toBe('renamed')
      expect(list[0].sql).toBe('SELECT 2')
    })

    it('keeps connectionType optional', () => {
      store.upsertSavedQuery(sq('a'))
      expect(store.listSavedQueries()[0].connectionType).toBeUndefined()
    })

    it('deletes a saved query', () => {
      store.upsertSavedQuery(sq('a'))
      store.upsertSavedQuery(sq('b'))
      store.deleteSavedQuery('a')
      expect(store.listSavedQueries().map((q) => q.id)).toEqual(['b'])
    })

    it('imports only into an empty table', () => {
      expect(store.importSavedQueries([sq('a'), sq('b')])).toBe(2)
      expect(store.importSavedQueries([sq('c')])).toBe(0)
      expect(store.listSavedQueries()).toHaveLength(2)
    })
  })

  describe('query history', () => {
    const qh = (id: string, over: Partial<QueryHistoryEntry> = {}): QueryHistoryEntry => ({
      id,
      sql: 'SELECT 1',
      status: 'ok',
      executedAt: Date.now(),
      ...over,
    })

    it('starts empty', () => {
      expect(store.listQueryHistory()).toEqual([])
    })

    it('records a run with all fields round-tripped', () => {
      store.addQueryHistory(
        qh('a', {
          sql: 'SELECT * FROM t',
          connectionId: 'c1',
          connectionType: 'postgresql',
          status: 'ok',
          durationMs: 12,
          rowCount: 5,
          executedAt: 1000,
        }),
        100,
      )
      const [row] = store.listQueryHistory()
      expect(row).toEqual({
        id: 'a',
        sql: 'SELECT * FROM t',
        connectionId: 'c1',
        connectionType: 'postgresql',
        status: 'ok',
        durationMs: 12,
        rowCount: 5,
        executedAt: 1000,
      })
    })

    it('records error runs with the message and omits optional fields', () => {
      store.addQueryHistory(qh('a', { status: 'error', error: 'boom', executedAt: 1 }), 100)
      const [row] = store.listQueryHistory()
      expect(row.status).toBe('error')
      expect(row.error).toBe('boom')
      expect(row.rowCount).toBeUndefined()
      expect(row.durationMs).toBeUndefined()
    })

    it('returns newest-first', () => {
      store.addQueryHistory(qh('old', { executedAt: 1000 }), 100)
      store.addQueryHistory(qh('new', { executedAt: 2000 }), 100)
      expect(store.listQueryHistory().map((r) => r.id)).toEqual(['new', 'old'])
    })

    it('prunes to the newest maxItems on insert', () => {
      for (let i = 0; i < 5; i++) {
        store.addQueryHistory(qh(`q${i}`, { executedAt: 1000 + i }), 3)
      }
      const ids = store.listQueryHistory().map((r) => r.id)
      expect(ids).toEqual(['q4', 'q3', 'q2'])
    })

    it('clamps a maxItems of 0 to keep at least the latest row', () => {
      store.addQueryHistory(qh('a', { executedAt: 1 }), 0)
      store.addQueryHistory(qh('b', { executedAt: 2 }), 0)
      expect(store.listQueryHistory().map((r) => r.id)).toEqual(['b'])
    })

    it('honours the list limit argument', () => {
      for (let i = 0; i < 5; i++) {
        store.addQueryHistory(qh(`q${i}`, { executedAt: 1000 + i }), 100)
      }
      expect(store.listQueryHistory(2).map((r) => r.id)).toEqual(['q4', 'q3'])
    })

    it('deletes one entry and clears all', () => {
      store.addQueryHistory(qh('a', { executedAt: 1 }), 100)
      store.addQueryHistory(qh('b', { executedAt: 2 }), 100)
      store.deleteQueryHistory('a')
      expect(store.listQueryHistory().map((r) => r.id)).toEqual(['b'])
      store.clearQueryHistory()
      expect(store.listQueryHistory()).toEqual([])
    })
  })
})
