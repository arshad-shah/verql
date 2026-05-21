import { describe, it, expect, vi, afterEach } from 'vitest'
import { AnthropicProvider } from '../../src/main/plugins/bundled/ai/internal/providers/anthropic'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AnthropicProvider', () => {
  it('has correct metadata', () => {
    const provider = new AnthropicProvider(() => 'test-key')
    expect(provider.id).toBe('anthropic')
    expect(provider.name).toBe('Anthropic')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        data: [
          { id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6' },
          { id: 'claude-opus-4-7', display_name: 'Claude Opus 4.7' }
        ],
        has_more: false,
        last_id: null
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    )
    const provider = new AnthropicProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id.includes('claude'))).toBe(true)
  })

  it('returns empty list when API key is missing', async () => {
    const provider = new AnthropicProvider(() => null)
    const models = await provider.models()
    expect(models).toEqual([])
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
