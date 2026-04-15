import { describe, it, expect } from 'vitest'
import { AnthropicProvider } from '../../src/main/ai/providers/anthropic'

describe('AnthropicProvider', () => {
  it('has correct metadata', () => {
    const provider = new AnthropicProvider(() => 'test-key')
    expect(provider.id).toBe('anthropic')
    expect(provider.name).toBe('Anthropic')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    const provider = new AnthropicProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id.includes('claude'))).toBe(true)
  })

  it('throws when no API key', async () => {
    const provider = new AnthropicProvider(() => null)
    await expect(async () => {
      for await (const _ of provider.chat({
        model: 'claude-sonnet-4-6',
        messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }]
      })) { /* consume */ }
    }).rejects.toThrow('Anthropic API key not configured')
  })
})
