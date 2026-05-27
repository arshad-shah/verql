import { describe, it, expect } from 'vitest'
import type {
  AIContextProvider,
  AIProvider,
  AIProviderModel,
  AIProviderChunk,
  AIProviderChatRequest,
  AIToolDefinition
} from '../../src/main/plugins/bundled/ai/internal/types'

describe('AIContextProvider', () => {
  it('can construct a context provider that satisfies the interface', async () => {
    const provider: AIContextProvider = {
      id: 'postgres-schema-context',
      appliesTo(connectionId: string): boolean {
        return connectionId.startsWith('pg-')
      },
      async getContext(connectionId: string): Promise<string> {
        return `Schema context for connection ${connectionId}`
      }
    }

    expect(provider.id).toBe('postgres-schema-context')
    expect(provider.appliesTo('pg-123')).toBe(true)
    expect(provider.appliesTo('mongo-456')).toBe(false)

    const ctx = await provider.getContext('pg-123')
    expect(ctx).toBe('Schema context for connection pg-123')
  })

  it('context provider can return empty string when no schema available', async () => {
    const provider: AIContextProvider = {
      id: 'empty-context',
      appliesTo: () => true,
      async getContext(): Promise<string> {
        return ''
      }
    }

    const ctx = await provider.getContext('any-connection')
    expect(ctx).toBe('')
  })
})

describe('AIProvider', () => {
  it('can construct a provider stub that satisfies the interface', async () => {
    const modelList: AIProviderModel[] = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        capabilities: ['chat', 'tool-calling']
      }
    ]

    const provider: AIProvider = {
      id: 'openai',
      name: 'OpenAI',
      supportsToolCalling: true,
      async models(): Promise<AIProviderModel[]> {
        return modelList
      },
      async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
        yield { type: 'text', content: 'Hello' }
        yield { type: 'done' }
      }
    }

    expect(provider.id).toBe('openai')
    expect(provider.supportsToolCalling).toBe(true)

    const models = await provider.models()
    expect(models).toHaveLength(1)
    expect(models[0].capabilities).toContain('tool-calling')

    const chunks: AIProviderChunk[] = []
    for await (const chunk of provider.chat({
      model: 'gpt-4o',
      messages: []
    })) {
      chunks.push(chunk)
    }
    expect(chunks[0]).toEqual({ type: 'text', content: 'Hello' })
    expect(chunks[1]).toEqual({ type: 'done' })
  })

  it('AIProviderModel captures all required fields', () => {
    const model: AIProviderModel = {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      contextWindow: 200000,
      capabilities: ['chat']
    }
    expect(model.contextWindow).toBe(200000)
    expect(model.capabilities).toEqual(['chat'])
  })

  it('AIToolDefinition captures name, description, and JSON schema parameters', () => {
    const def: AIToolDefinition = {
      name: 'get_schema',
      description: 'Returns schema information',
      parameters: {
        type: 'object',
        properties: {
          tableName: { type: 'string' }
        },
        required: ['tableName']
      }
    }
    expect(def.name).toBe('get_schema')
    expect(def.parameters['type']).toBe('object')
  })
})
