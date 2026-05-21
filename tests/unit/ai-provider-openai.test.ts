import { describe, it, expect, vi, afterEach } from 'vitest'
import { OpenAIProvider } from '../../src/main/plugins/bundled/ai/internal/providers/openai'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OpenAIProvider', () => {
  it('has correct metadata', () => {
    const provider = new OpenAIProvider(() => 'test-key')
    expect(provider.id).toBe('openai')
    expect(provider.name).toBe('OpenAI')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        data: [
          { id: 'gpt-4o' },
          { id: 'gpt-4o-mini' },
          { id: 'whisper-1' } // non-chat, should be filtered out
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const provider = new OpenAIProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id === 'gpt-4o')).toBe(true)
  })

  it('returns empty list when API key is missing', async () => {
    const provider = new OpenAIProvider(() => null)
    const models = await provider.models()
    expect(models).toEqual([])
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
