import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk } from '../types'
import type { AIToolCallRequest } from '@shared/ai-types'

const MODELS: AIProviderModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1', name: 'GPT-4.1', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
]

const API_URL = 'https://api.openai.com/v1/chat/completions'

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  readonly supportsToolCalling = true

  constructor(private readonly getApiKey: () => string | null) {}

  async models(): Promise<AIProviderModel[]> {
    return MODELS
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const messages = request.messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: msg.toolCallId ?? '',
          content: msg.content,
        }
      }
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: 'assistant' as const,
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        }
      }
      return { role: msg.role, content: msg.content }
    })

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream: true,
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: request.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body from OpenAI API')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // Accumulate tool call deltas: keyed by index
    const toolCallAccumulator = new Map<
      number,
      { id: string; name: string; arguments: string }
    >()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            // Flush any accumulated tool calls
            for (const [, tc] of toolCallAccumulator) {
              yield {
                type: 'tool-call',
                toolCall: { id: tc.id, name: tc.name, arguments: tc.arguments },
              }
            }
            toolCallAccumulator.clear()
            yield { type: 'done' }
            return
          }

          let parsed: Record<string, unknown>
          try {
            parsed = JSON.parse(data)
          } catch {
            continue
          }

          const choices = parsed.choices as Array<Record<string, unknown>> | undefined
          if (!choices || choices.length === 0) continue

          const choice = choices[0]
          const delta = choice.delta as Record<string, unknown> | undefined
          if (!delta) continue

          // Handle text content
          if (typeof delta.content === 'string' && delta.content.length > 0) {
            yield { type: 'text', content: delta.content }
          }

          // Handle tool call deltas
          const toolCallDeltas = delta.tool_calls as Array<Record<string, unknown>> | undefined
          if (toolCallDeltas) {
            for (const tcDelta of toolCallDeltas) {
              const index = tcDelta.index as number
              const fn = tcDelta.function as Record<string, unknown> | undefined

              if (!toolCallAccumulator.has(index)) {
                toolCallAccumulator.set(index, {
                  id: (tcDelta.id as string) ?? '',
                  name: (fn?.name as string) ?? '',
                  arguments: '',
                })
              }

              const acc = toolCallAccumulator.get(index)!
              // Update id/name if provided (usually only on first delta for that index)
              if (tcDelta.id) acc.id = tcDelta.id as string
              if (fn?.name) acc.name = (fn.name as string)
              if (fn?.arguments) acc.arguments += fn.arguments as string
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
