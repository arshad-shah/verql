import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk } from '../types'
import type { AIChatMessage } from '@shared/ai-types'

/**
 * Returns true if the given Anthropic model still accepts the `temperature`
 * parameter. Claude 4.x and newer deprecated it — sending it produces a hard
 * 400 from the API. Matches both `claude-opus-4`, `claude-4-opus`, and the
 * dated variants like `claude-opus-4-7`.
 */
function supportsTemperature(modelId: string): boolean {
  const id = modelId.toLowerCase()
  // Claude 4.x (any tier, any date suffix)
  if (/claude-(opus|sonnet|haiku)-([4-9]|\d{2,})\b/.test(id)) return false
  if (/claude-([4-9]|\d{2,})-(opus|sonnet|haiku)\b/.test(id)) return false
  return true
}

/**
 * Relative price rank from the Claude family naming: Haiku (cheapest) <
 * Sonnet < Opus. Unknown models default to the middle tier.
 */
function anthropicCostTier(modelId: string): number {
  const id = modelId.toLowerCase()
  if (id.includes('haiku')) return 0
  if (id.includes('sonnet')) return 1
  if (id.includes('opus')) return 2
  return 1
}

/**
 * Context window per Anthropic model. The /v1/models endpoint doesn't return
 * this, so we pattern-match the id. Validated against the public Anthropic
 * model docs (https://docs.anthropic.com/en/docs/about-claude/models/overview)
 * which list the wide-context tier explicitly:
 *   - Opus 4.6 and later     → 1M tokens
 *   - Sonnet 4.6 and later   → 1M tokens
 *   - Everything else        → 200k tokens (Haiku 4.5, Sonnet 4.5, Opus 4.5,
 *                              Opus 4.1, Sonnet 4, Opus 4, and the 3.x family)
 */
function anthropicContextWindow(modelId: string): number {
  const id = modelId.toLowerCase()
  const ONE_MILLION = 1_000_000
  const TWO_HUNDRED_K = 200_000
  if (/claude-opus-4-([6-9]|\d{2})/.test(id)) return ONE_MILLION
  if (/claude-sonnet-4-([6-9]|\d{2})/.test(id)) return ONE_MILLION
  return TWO_HUNDRED_K
}

interface AnthropicModel {
  id: string
  display_name: string
  created_at: string
  type: string
}

interface AnthropicModelsResponse {
  data: AnthropicModel[]
  has_more: boolean
  last_id?: string
}

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string }

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContentBlock[]
}

function toAnthropicMessages(messages: AIChatMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = []

  for (const msg of messages) {
    if (msg.role === 'system') continue

    if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      const content: AnthropicContentBlock[] = []
      if (msg.content) {
        content.push({ type: 'text', text: msg.content })
      }
      for (const tc of msg.toolCalls) {
        let input: unknown = {}
        try { input = JSON.parse(tc.arguments || '{}') } catch { /* use empty */ }
        content.push({ type: 'tool_use', id: tc.id, name: tc.name, input })
      }
      result.push({ role: 'assistant', content })
    } else if (msg.role === 'tool') {
      // Anthropic expects tool results as user messages with tool_result content blocks.
      // Merge consecutive tool results into a single user message.
      const last = result[result.length - 1]
      const block: AnthropicContentBlock = {
        type: 'tool_result',
        tool_use_id: msg.toolCallId ?? '',
        content: msg.content
      }
      if (last && last.role === 'user' && Array.isArray(last.content) &&
          last.content.length > 0 && last.content[0].type === 'tool_result') {
        last.content.push(block)
      } else {
        result.push({ role: 'user', content: [block] })
      }
    } else {
      result.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })
    }
  }

  return result
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly supportsToolCalling = true

  constructor(private readonly getApiKey: () => string | null) {}

  async models(): Promise<AIProviderModel[]> {
    const apiKey = this.getApiKey()
    if (!apiKey) return []

    const allModels: AIProviderModel[] = []
    let lastId: string | undefined

    try {
      do {
        const url = new URL('https://api.anthropic.com/v1/models')
        url.searchParams.set('limit', '100')
        if (lastId) url.searchParams.set('after_id', lastId)

        const response = await fetch(url.toString(), {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        })

        if (!response.ok) return []

        const data = (await response.json()) as AnthropicModelsResponse
        for (const m of data.data) {
          allModels.push({
            id: m.id,
            name: m.display_name,
            contextWindow: anthropicContextWindow(m.id),
            capabilities: ['chat', 'tool-calling'],
            costTier: anthropicCostTier(m.id),
          })
        }

        if (data.has_more && data.last_id) {
          lastId = data.last_id
        } else {
          break
        }
      } while (true)
    } catch {
      return []
    }

    return allModels
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
      max_tokens: request.maxTokens ?? 4096,
      messages: anthropicMessages,
      stream: true,
    }

    // Anthropic deprecated `temperature` for the Claude 4.x family (Opus 4,
    // Sonnet 4, Haiku 4, …). Sending it returns HTTP 400, so we drop it for
    // those model IDs and only forward it on older Claude 3.x models.
    if (request.temperature !== undefined && supportsTemperature(request.model)) {
      body.temperature = request.temperature
    }

    if (request.stopSequences && request.stopSequences.length > 0) {
      body.stop_sequences = request.stopSequences
    }

    // Prompt caching: mark the stable portions of each request (system
    // prompt and the tools array) with `cache_control: { type: 'ephemeral' }`.
    // Anthropic keeps a 5-minute prefix cache keyed on these blocks; hits on
    // cached input tokens are ~10% of the normal input price and skip
    // re-processing on the server, which is the single biggest TTFT win for
    // long chats. The system prompt is composed once per turn from rules +
    // schema-name list + saved connections + notifications + app-actions
    // catalog — turn-to-turn it's stable, so the breakpoint here amortises
    // across the whole conversation. The tool catalog is even more stable
    // (only changes when plugins activate/deactivate).
    //
    // Two breakpoints used; the API permits four.
    if (systemMessage) {
      body.system = [
        { type: 'text', text: systemMessage.content, cache_control: { type: 'ephemeral' } },
      ]
    }

    if (request.tools && request.tools.length > 0) {
      const tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }))
      // The cache_control marker on the last tool tells Anthropic to cache
      // every preceding tool definition along with it.
      const lastIdx = tools.length - 1
      body.tools = tools.map((t, i) =>
        i === lastIdx ? { ...t, cache_control: { type: 'ephemeral' } } : t
      )
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
    let inputTokens = 0
    let outputTokens = 0

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
          } else if (type === 'message_start') {
            const message = event.message as Record<string, unknown> | undefined
            const usage = message?.usage as Record<string, number> | undefined
            if (usage) {
              inputTokens += usage.input_tokens ?? 0
              outputTokens += usage.output_tokens ?? 0
            }
          } else if (type === 'message_delta') {
            const usage = event.usage as Record<string, number> | undefined
            if (usage) {
              outputTokens += usage.output_tokens ?? 0
            }
          } else if (type === 'message_stop') {
            yield { type: 'done', usage: { inputTokens, outputTokens } }
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
