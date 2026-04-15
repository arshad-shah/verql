import { describe, it, expect } from 'vitest'
import { OpenAIProvider } from '../../src/main/ai/providers/openai'

describe('OpenAIProvider', () => {
  it('has correct metadata', () => {
    const provider = new OpenAIProvider(() => 'test-key')
    expect(provider.id).toBe('openai')
    expect(provider.name).toBe('OpenAI')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    const provider = new OpenAIProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id === 'gpt-4o')).toBe(true)
  })

  it('throws when no API key', async () => {
    const provider = new OpenAIProvider(() => null)
    await expect(async () => {
      for await (const _ of provider.chat({
        model: 'gpt-4o',
        messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }]
      })) { /* consume */ }
    }).rejects.toThrow('OpenAI API key not configured')
  })
})
