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

  it('attaches cache_control to system prompt and last tool', async () => {
    let captured: { system?: unknown; tools?: unknown[] } = {}
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
      captured = JSON.parse((init as RequestInit).body as string)
      // Minimal SSE stream that ends immediately.
      const body = 'data: {"type":"message_stop"}\n\n'
      return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
    })
    const provider = new AnthropicProvider(() => 'test-key')
    for await (const _ of provider.chat({
      model: 'claude-sonnet-4-6',
      messages: [
        { id: 's', role: 'system', content: 'You are helpful.', timestamp: 0 },
        { id: 'u', role: 'user', content: 'hi', timestamp: 0 },
      ],
      tools: [
        { name: 'a', description: 'A', parameters: { type: 'object' } },
        { name: 'b', description: 'B', parameters: { type: 'object' } },
      ],
    })) { /* drain */ }

    expect(captured.system).toEqual([
      { type: 'text', text: 'You are helpful.', cache_control: { type: 'ephemeral' } },
    ])
    const tools = captured.tools as Array<Record<string, unknown>>
    expect(tools).toHaveLength(2)
    expect(tools[0].cache_control).toBeUndefined()
    expect(tools[1].cache_control).toEqual({ type: 'ephemeral' })
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
