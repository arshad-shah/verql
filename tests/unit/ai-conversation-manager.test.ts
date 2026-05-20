// tests/unit/ai-conversation-manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConversationManager } from '../../src/main/plugins/bundled/ai/internal/conversation-manager'
import type { AIProvider } from '../../src/main/plugins/bundled/ai/internal/types'
import { AIProviderRegistry } from '../../src/main/plugins/bundled/ai/internal/provider-registry'
import { AIToolRegistry } from '../../src/main/plugins/bundled/ai/internal/tool-registry'
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
  let toolRegistry: AIToolRegistry
  let permissionManager: PermissionManager
  let manager: ConversationManager

  beforeEach(() => {
    providerRegistry = new AIProviderRegistry()
    toolRegistry = new AIToolRegistry()
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

  it('throws when no active provider', async () => {
    manager.addUserMessage('Hi')
    await expect(async () => {
      for await (const _ of manager.chat()) { /* consume */ }
    }).rejects.toThrow('No active AI provider')
  })
})
