import { describe, it, expect } from 'vitest'
import type {
  AIChatMessage,
  AIToolCallRequest,
  AIChatChunk,
  AIApprovalRequest,
  AIToolCallResult,
  AIStreamEvent,
  AIModelInfo,
  AIProviderInfo,
  AIChatStartRequest
} from '../../shared/ai-types'

describe('AI Types', () => {
  describe('AIChatMessage', () => {
    it('constructs a user message', () => {
      const msg: AIChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Show me all tables',
        timestamp: Date.now()
      }
      expect(msg.id).toBe('msg-1')
      expect(msg.role).toBe('user')
      expect(msg.content).toBe('Show me all tables')
      expect(typeof msg.timestamp).toBe('number')
    })

    it('constructs an assistant message with tool calls', () => {
      const toolCall: AIToolCallRequest = {
        id: 'tc-1',
        name: 'execute_query',
        arguments: JSON.stringify({ sql: 'SELECT * FROM users' })
      }
      const msg: AIChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'I will run a query for you.',
        toolCalls: [toolCall],
        timestamp: Date.now()
      }
      expect(msg.role).toBe('assistant')
      expect(msg.toolCalls).toHaveLength(1)
      expect(msg.toolCalls![0].name).toBe('execute_query')
    })

    it('constructs a tool result message', () => {
      const msg: AIChatMessage = {
        id: 'msg-3',
        role: 'tool',
        content: '{"rows": []}',
        toolCallId: 'tc-1',
        timestamp: Date.now()
      }
      expect(msg.role).toBe('tool')
      expect(msg.toolCallId).toBe('tc-1')
    })

    it('constructs a system message', () => {
      const msg: AIChatMessage = {
        id: 'msg-0',
        role: 'system',
        content: 'You are a helpful database assistant.',
        timestamp: 0
      }
      expect(msg.role).toBe('system')
    })
  })

  describe('AIToolCallRequest', () => {
    it('constructs with required fields', () => {
      const req: AIToolCallRequest = {
        id: 'tc-42',
        name: 'list_tables',
        arguments: '{}'
      }
      expect(req.id).toBe('tc-42')
      expect(req.name).toBe('list_tables')
      expect(req.arguments).toBe('{}')
    })
  })

  describe('AIChatChunk', () => {
    it('constructs a text chunk', () => {
      const chunk: AIChatChunk = { type: 'text', content: 'Hello' }
      expect(chunk.type).toBe('text')
      expect(chunk.content).toBe('Hello')
    })

    it('constructs a tool-call chunk', () => {
      const toolCall: AIToolCallRequest = { id: 'tc-1', name: 'foo', arguments: '{}' }
      const chunk: AIChatChunk = { type: 'tool-call', toolCall }
      expect(chunk.type).toBe('tool-call')
      expect(chunk.toolCall?.name).toBe('foo')
    })

    it('constructs a done chunk', () => {
      const chunk: AIChatChunk = { type: 'done' }
      expect(chunk.type).toBe('done')
    })

    it('constructs an error chunk', () => {
      const chunk: AIChatChunk = { type: 'error', error: 'Something went wrong' }
      expect(chunk.type).toBe('error')
      expect(chunk.error).toBe('Something went wrong')
    })
  })

  describe('AIApprovalRequest', () => {
    it('constructs with all required fields', () => {
      const req: AIApprovalRequest = {
        requestId: 'apr-1',
        toolName: 'execute_query',
        toolDescription: 'Executes a SQL query',
        parameters: { sql: 'DROP TABLE users', connectionId: 'conn-1' },
        display: 'Execute: DROP TABLE users'
      }
      expect(req.requestId).toBe('apr-1')
      expect(req.toolName).toBe('execute_query')
      expect(req.parameters['sql']).toBe('DROP TABLE users')
      expect(req.display).toBe('Execute: DROP TABLE users')
    })
  })

  describe('AIToolCallResult', () => {
    it('constructs a successful result', () => {
      const result: AIToolCallResult = {
        toolCallId: 'tc-1',
        toolName: 'list_tables',
        success: true,
        data: ['users', 'posts', 'comments'],
        display: '3 tables found'
      }
      expect(result.success).toBe(true)
      expect(result.toolCallId).toBe('tc-1')
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('constructs a failed result', () => {
      const result: AIToolCallResult = {
        toolCallId: 'tc-2',
        toolName: 'execute_query',
        success: false,
        data: null
      }
      expect(result.success).toBe(false)
      expect(result.display).toBeUndefined()
    })
  })

  describe('AIStreamEvent', () => {
    it('constructs a chunk event', () => {
      const event: AIStreamEvent = { type: 'chunk', content: 'Hello' }
      expect(event.type).toBe('chunk')
      if (event.type === 'chunk') {
        expect(event.content).toBe('Hello')
      }
    })

    it('constructs a tool-call event', () => {
      const toolCall: AIToolCallRequest = { id: 'tc-1', name: 'foo', arguments: '{}' }
      const event: AIStreamEvent = { type: 'tool-call', toolCall }
      expect(event.type).toBe('tool-call')
    })

    it('constructs a tool-result event', () => {
      const result: AIToolCallResult = {
        toolCallId: 'tc-1',
        toolName: 'foo',
        success: true,
        data: 42
      }
      const event: AIStreamEvent = { type: 'tool-result', result }
      expect(event.type).toBe('tool-result')
    })

    it('constructs an approval-request event', () => {
      const request: AIApprovalRequest = {
        requestId: 'apr-1',
        toolName: 'execute_query',
        toolDescription: 'Runs SQL',
        parameters: {},
        display: 'Run query'
      }
      const event: AIStreamEvent = { type: 'approval-request', request }
      expect(event.type).toBe('approval-request')
    })

    it('constructs a done event', () => {
      const event: AIStreamEvent = { type: 'done' }
      expect(event.type).toBe('done')
    })

    it('constructs an error event', () => {
      const event: AIStreamEvent = { type: 'error', error: 'Network failure' }
      expect(event.type).toBe('error')
      if (event.type === 'error') {
        expect(event.error).toBe('Network failure')
      }
    })
  })

  describe('AIModelInfo', () => {
    it('constructs with all fields', () => {
      const model: AIModelInfo = {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        capabilities: ['chat', 'tool-calling']
      }
      expect(model.id).toBe('claude-3-5-sonnet-20241022')
      expect(model.contextWindow).toBe(200000)
      expect(model.capabilities).toContain('chat')
      expect(model.capabilities).toContain('tool-calling')
    })

    it('supports chat-only capabilities', () => {
      const model: AIModelInfo = {
        id: 'basic-model',
        name: 'Basic Model',
        contextWindow: 4096,
        capabilities: ['chat']
      }
      expect(model.capabilities).toHaveLength(1)
      expect(model.capabilities[0]).toBe('chat')
    })
  })

  describe('AIProviderInfo', () => {
    it('constructs with required fields', () => {
      const provider: AIProviderInfo = {
        id: 'anthropic',
        name: 'Anthropic'
      }
      expect(provider.id).toBe('anthropic')
      expect(provider.name).toBe('Anthropic')
    })
  })

  describe('AIChatStartRequest', () => {
    it('constructs with just a message', () => {
      const req: AIChatStartRequest = {
        message: 'List all tables in this database'
      }
      expect(req.message).toBe('List all tables in this database')
      expect(req.connectionId).toBeUndefined()
    })

    it('constructs with message and connectionId', () => {
      const req: AIChatStartRequest = {
        message: 'Show me the schema',
        connectionId: 'conn-abc'
      }
      expect(req.connectionId).toBe('conn-abc')
    })
  })
})
