import { describe, it, expect } from 'vitest'
import { OllamaProvider } from '../../src/main/ai/providers/ollama'

describe('OllamaProvider', () => {
  it('has correct metadata', () => {
    const provider = new OllamaProvider()
    expect(provider.id).toBe('ollama')
    expect(provider.name).toBe('Ollama')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('uses custom endpoint', () => {
    const provider = new OllamaProvider('http://custom:1234')
    expect(provider.endpoint).toBe('http://custom:1234')
  })

  it('defaults to localhost:11434', () => {
    const provider = new OllamaProvider()
    expect(provider.endpoint).toBe('http://localhost:11434')
  })
})
