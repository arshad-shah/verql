// tests/unit/ai-conversation-manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { ConversationManager } from '../../src/main/plugins/bundled/ai/internal/conversation-manager'
import type { AIProvider } from '../../src/main/plugins/bundled/ai/internal/types'
import { AIProviderRegistry } from '../../src/main/plugins/bundled/ai/internal/provider-registry'
import { ToolRegistryImpl } from '../../src/main/plugins/sdk/tool-registry'
import { PermissionManager } from '../../src/main/plugins/bundled/ai/internal/permission-manager'
import type { AIChatMessage, AIStreamEvent } from '@shared/ai-types'

function createMockProvider(chunks: Array<{ type: string; content?: string }>): AIProvider {
  return {
    id: 'mock',
    name: 'Mock',
    supportsToolCalling: false,
    models: async () => [{ id: 'mock-1', name: 'Mock', contextWindow: 4096, capabilities: ['chat'] as const }],
    async *chat() {
      for (const chunk of chunks) {
        yield chunk as any
      }
    }
  }
}

describe('ConversationManager', () => {
  let providerRegistry: AIProviderRegistry
  let toolRegistry: ToolRegistryImpl
  let permissionManager: PermissionManager
  let manager: ConversationManager

  beforeEach(() => {
    providerRegistry = new AIProviderRegistry()
    toolRegistry = new ToolRegistryImpl()
    permissionManager = new PermissionManager()
    manager = new ConversationManager({
      providerRegistry,
      toolRegistry,
      permissionManager,
      getSchemaContext: async () => 'Tables: users, orders',
      getConnectionId: () => 'conn-1'
    })
  })

  it('starts with empty messages', () => {
    expect(manager.getMessages()).toEqual([])
  })

  it('adds user message and returns it', () => {
    manager.addUserMessage('Hello')
    const msgs = manager.getMessages()
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('Hello')
  })

  it('clears messages', () => {
    manager.addUserMessage('Hello')
    manager.clearMessages()
    expect(manager.getMessages()).toEqual([])
  })

  it('assembles context with schema info', async () => {
    const context = await manager.assembleSystemMessage()
    expect(context).toContain('Tables: users, orders')
  })

  it('includes the app-action catalog and deep-link guidance in the system message', async () => {
    const catalog = '- new-connection() [navigation]: Open the new-connection form'
    const msg = await manager.assembleSystemMessage(undefined, 'conn-1', catalog)
    expect(msg).toContain('new-connection')
    expect(msg).toContain('verql://action/')
  })

  it('includes the saved-connections summary so the AI can tell existing from new', async () => {
    const summary = '- Prod (postgres) — not connected\n- Local (sqlite) — connected, active'
    const msg = await manager.assembleSystemMessage(undefined, 'conn-1', undefined, summary)
    expect(msg).toContain('Saved connections')
    expect(msg).toContain('Prod (postgres)')
  })

  it('includes the recent-notifications summary for diagnostics', async () => {
    const notes = '- [error] Query failed: syntax error near "FORM"'
    const msg = await manager.assembleSystemMessage(undefined, 'conn-1', undefined, undefined, notes)
    expect(msg).toContain('Recent notifications')
    expect(msg).toContain('syntax error near "FORM"')
  })

  it('streams a simple text response', async () => {
    const provider = createMockProvider([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' }
    ])
    providerRegistry.register(provider)
    providerRegistry.setActive('mock')
    providerRegistry.setActiveModel('mock-1')

    manager.addUserMessage('Hi')

    const events: AIStreamEvent[] = []
    for await (const event of manager.chat()) {
      events.push(event)
    }

    expect(events).toEqual([
      { type: 'chunk', content: 'Hello' },
      { type: 'chunk', content: ' world' },
      { type: 'done' }
    ])

    const msgs = manager.getMessages()
    expect(msgs).toHaveLength(2)
    expect(msgs[1].role).toBe('assistant')
    expect(msgs[1].content).toBe('Hello world')
  })

  it('runs a tool from the shared registry and streams its result', async () => {
    // A tool-calling provider that asks for `list_tables` on the first turn,
    // then (after the tool result is fed back) answers with text on the second.
    let turn = 0
    const provider: AIProvider = {
      id: 'mock', name: 'Mock', supportsToolCalling: true,
      models: async () => [{ id: 'mock-1', name: 'Mock', contextWindow: 4096, capabilities: ['chat', 'tool-calling'] as const }],
      async *chat() {
        turn++
        if (turn === 1) {
          yield { type: 'tool-call', toolCall: { id: 't1', name: 'list_tables', arguments: '{}' } } as never
          yield { type: 'done' } as never
        } else {
          yield { type: 'text', content: 'Here are the tables.' } as never
          yield { type: 'done' } as never
        }
      }
    }
    providerRegistry.register(provider)
    providerRegistry.setActive('mock')
    providerRegistry.setActiveModel('mock-1')

    const execute = vi.fn(async () => ({ success: true, data: ['users', 'orders'], display: '2 tables' }))
    toolRegistry.register({
      id: 'list_tables', name: 'List Tables', description: 'list tables',
      inputSchema: z.object({}), permission: 'read', execute
    })

    manager.addUserMessage('list the tables')

    const events: AIStreamEvent[] = []
    for await (const event of manager.chat()) events.push(event)

    // The tool was actually invoked through the shared registry with the active connection.
    expect(execute).toHaveBeenCalledOnce()
    expect(execute.mock.calls[0][1]).toMatchObject({ connectionId: 'conn-1' })

    const toolCall = events.find(e => e.type === 'tool-call')
    expect(toolCall).toMatchObject({ type: 'tool-call', toolCall: { name: 'list_tables' } })

    const toolResult = events.find(e => e.type === 'tool-result')
    expect(toolResult).toMatchObject({ type: 'tool-result', result: { success: true, data: ['users', 'orders'] } })

    // Final assistant turn after the tool round.
    expect(events.some(e => e.type === 'chunk' && e.content === 'Here are the tables.')).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'done' })
  })

  it('uses the per-request connectionId for tool execution, overriding the ambient one', async () => {
    // getConnectionId() returns 'conn-1' (ambient), but the chat request carries
    // 'conn-2' — the connection the user actually has active in the UI. The tool
    // must run against 'conn-2'.
    let turn = 0
    const provider: AIProvider = {
      id: 'mock', name: 'Mock', supportsToolCalling: true,
      models: async () => [{ id: 'mock-1', name: 'Mock', contextWindow: 4096, capabilities: ['chat', 'tool-calling'] as const }],
      async *chat() {
        turn++
        if (turn === 1) {
          yield { type: 'tool-call', toolCall: { id: 't1', name: 'list_tables', arguments: '{}' } } as never
          yield { type: 'done' } as never
        } else {
          yield { type: 'text', content: 'done' } as never
          yield { type: 'done' } as never
        }
      }
    }
    providerRegistry.register(provider)
    providerRegistry.setActive('mock')
    providerRegistry.setActiveModel('mock-1')

    const execute = vi.fn(async () => ({ success: true, data: [], display: 'ok' }))
    toolRegistry.register({
      id: 'list_tables', name: 'List Tables', description: 'list tables',
      inputSchema: z.object({}), permission: 'read', execute
    })

    manager.addUserMessage('list the tables')
    for await (const _ of manager.chat({ connectionId: 'conn-2' })) { /* consume */ }

    expect(execute).toHaveBeenCalledOnce()
    expect(execute.mock.calls[0][1]).toMatchObject({ connectionId: 'conn-2' })
  })

  it('throws when no active provider', async () => {
    manager.addUserMessage('Hi')
    await expect(async () => {
      for await (const _ of manager.chat()) { /* consume */ }
    }).rejects.toThrow('No active AI provider')
  })
})
