import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk } from '../types'

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama'
  readonly supportsToolCalling = true
  readonly endpoint: string

  constructor(endpoint?: string) {
    this.endpoint = endpoint ?? 'http://localhost:11434'
  }

  async models(): Promise<AIProviderModel[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      if (!response.ok) return []
      const data = (await response.json()) as { models?: Array<{ name: string; details?: { parameter_size?: string } }> }
      return (data.models ?? []).map((m) => ({
        id: m.name,
        name: m.name,
        contextWindow: 8192,
        capabilities: ['chat', 'tool-calling'] as ('chat' | 'tool-calling')[],
      }))
    } catch {
      return []
    }
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const { model, messages, tools, signal } = request

    const options: Record<string, unknown> = {}
    if (request.temperature !== undefined) options.temperature = request.temperature

    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCalls ? { tool_calls: m.toolCalls.map((tc) => ({ function: { name: tc.name, arguments: JSON.parse(tc.arguments) } })) } : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      })),
      stream: true,
      ...(Object.keys(options).length > 0 ? { options } : {}),
      ...(request.stopSequences && request.stopSequences.length > 0 ? { stop: request.stopSequences } : {}),
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    let response: Response
    try {
      response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })
    } catch (err) {
      yield { type: 'error', error: String(err) }
      return
    }

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      yield { type: 'error', error: `Ollama error ${response.status}: ${text}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body from Ollama' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          let parsed: {
            done?: boolean
            message?: {
              content?: string
              tool_calls?: Array<{
                function: { name: string; arguments: Record<string, unknown> }
              }>
            }
          }

          try {
            parsed = JSON.parse(trimmed)
          } catch {
            continue
          }

          const msg = parsed.message

          if (msg?.content) {
            yield { type: 'text', content: msg.content }
          }

          if (msg?.tool_calls) {
            for (const tc of msg.tool_calls) {
              yield {
                type: 'tool-call',
                toolCall: {
                  id: `ollama-${Date.now()}`,
                  name: tc.function.name,
                  arguments: JSON.stringify(tc.function.arguments),
                },
              }
            }
          }

          if (parsed.done) {
            yield { type: 'done' }
            return
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { type: 'done' }
  }
}
