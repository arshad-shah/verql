import { describe, it, expect, beforeEach } from 'vitest'
import { AIProviderRegistry } from '../../src/main/ai/provider-registry'
import type { AIProvider } from '../../src/main/ai/types'

function createMockProvider(id: string, name: string): AIProvider {
  return {
    id,
    name,
    supportsToolCalling: true,
    models: async () => [{ id: 'model-1', name: 'Model 1', contextWindow: 4096, capabilities: ['chat'] as const }],
    async *chat() { yield { type: 'done' as const } }
  }
}

describe('AIProviderRegistry', () => {
  let registry: AIProviderRegistry

  beforeEach(() => {
    registry = new AIProviderRegistry()
  })

  it('registers and retrieves a provider', () => {
    const provider = createMockProvider('openai', 'OpenAI')
    registry.register(provider)
    expect(registry.get('openai')).toBe(provider)
  })

  it('lists all providers', () => {
    registry.register(createMockProvider('openai', 'OpenAI'))
    registry.register(createMockProvider('anthropic', 'Anthropic'))
    expect(registry.list()).toHaveLength(2)
  })

  it('unregisters a provider', () => {
    registry.register(createMockProvider('openai', 'OpenAI'))
    registry.unregister('openai')
    expect(registry.get('openai')).toBeUndefined()
  })

  it('sets and gets active provider', () => {
    const provider = createMockProvider('openai', 'OpenAI')
    registry.register(provider)
    registry.setActive('openai')
    expect(registry.getActive()).toBe(provider)
  })

  it('returns null for active when none set', () => {
    expect(registry.getActive()).toBeNull()
  })

  it('throws when setting active to unknown provider', () => {
    expect(() => registry.setActive('unknown')).toThrow('Unknown AI provider: unknown')
  })

  it('sets and gets active model', () => {
    registry.setActiveModel('gpt-4o')
    expect(registry.getActiveModel()).toBe('gpt-4o')
  })
})
