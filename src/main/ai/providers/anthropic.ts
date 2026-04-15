import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk } from '../types'
import type { AIChatMessage } from '@shared/ai-types'

const MODELS: AIProviderModel[] = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
]

function toAnthropicRole(msg: AIChatMessage): 'user' | 'assistant' {
  if (msg.role === 'assistant') return 'assistant'
  // tool results and user messages both map to 'user'
  return 'user'
}

function toAnthropicMessages(messages: AIChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: toAnthropicRole(m),
      content: m.content,
    }))
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly supportsToolCalling = true

  constructor(private readonly getApiKey: () => string | null) {}

  async models(): Promise<AIProviderModel[]> {
    return MODELS
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const systemMessage = request.messages.find(m => m.role === 'system')
    const anthropicMessages = toAnthropicMessages(request.messages)

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: 4096,
      messages: anthropicMessages,
      stream: true,
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }))
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: request.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body from Anthropic API')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // Per-block state for tool call accumulation
    let currentBlockType: 'text' | 'tool_use' | null = null
    let currentToolName: string | null = null
    let currentToolId: string | null = null
    let partialJson = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          let event: Record<string, unknown>
          try {
            event = JSON.parse(data)
          } catch {
            continue
          }

          const type = event.type as string

          if (type === 'content_block_start') {
            const block = event.content_block as Record<string, unknown>
            if (block.type === 'text') {
              currentBlockType = 'text'
              currentToolName = null
              currentToolId = null
              partialJson = ''
            } else if (block.type === 'tool_use') {
              currentBlockType = 'tool_use'
              currentToolName = block.name as string
              currentToolId = block.id as string
              partialJson = ''
            }
          } else if (type === 'content_block_delta') {
            const delta = event.delta as Record<string, unknown>
            if (delta.type === 'text_delta' && currentBlockType === 'text') {
              yield { type: 'text', content: delta.text as string }
            } else if (delta.type === 'input_json_delta' && currentBlockType === 'tool_use') {
              partialJson += delta.partial_json as string
            }
          } else if (type === 'content_block_stop') {
            if (currentBlockType === 'tool_use' && currentToolName && currentToolId) {
              yield {
                type: 'tool-call',
                toolCall: {
                  id: currentToolId,
                  name: currentToolName,
                  arguments: partialJson,
                },
              }
              currentBlockType = null
              currentToolName = null
              currentToolId = null
              partialJson = ''
            } else {
              currentBlockType = null
            }
          } else if (type === 'message_stop') {
            yield { type: 'done' }
          } else if (type === 'error') {
            const error = event.error as Record<string, unknown>
            yield { type: 'error', error: (error.message as string) ?? 'Unknown Anthropic error' }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
