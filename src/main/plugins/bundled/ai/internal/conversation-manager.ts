// src/main/ai/conversation-manager.ts
import { randomUUID } from 'crypto'
import type { AIChatMessage, AIStreamEvent, AIToolCallRequest } from '@shared/ai-types'
import type { AIContextProvider } from './types'
import type { AIProviderRegistry } from './provider-registry'
import type { ToolRegistry } from '../../../sdk/types'
import type { PermissionManager } from './permission-manager'
import { estimateTokens, trimMessagesToBudget } from './token-estimate'
import { buildChatSystemPrompt } from '../prompts'

interface ConversationManagerDeps {
  providerRegistry: AIProviderRegistry
  toolRegistry: ToolRegistry
  permissionManager: PermissionManager
  getSchemaContext: (connectionId: string) => Promise<string>
  getConnectionId: () => string | null
  /** Token budget for the history sent each round (system prompt excluded from
   *  this cap, but its size is subtracted from the available window). Keeps a
   *  long conversation from growing the request unboundedly. */
  maxContextTokens?: number
}

/** Default ceiling for the request payload. Comfortably below the smallest
 *  models we target, and trimming only ever drops the oldest turns. */
const DEFAULT_MAX_CONTEXT_TOKENS = 24000
/** Always leave room for at least this much recent history after the system prompt. */
const MIN_HISTORY_TOKENS = 2000

export class ConversationManager {
  private messages: AIChatMessage[] = []
  private contextProviders: AIContextProvider[] = []
  private abortController: AbortController | null = null
  private deps: ConversationManagerDeps

  constructor(deps: ConversationManagerDeps) {
    this.deps = deps
  }

  getMessages(): AIChatMessage[] {
    return [...this.messages]
  }

  addUserMessage(content: string): AIChatMessage {
    const msg: AIChatMessage = {
      id: randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    this.messages.push(msg)
    return msg
  }

  clearMessages(): void {
    this.messages = []
  }

  /** Replace the in-memory history wholesale. Used when the renderer switches to
   *  or branches a persisted conversation, so the next `chat()` round runs
   *  against that conversation's turns rather than the previous one's. */
  setMessages(messages: AIChatMessage[]): void {
    this.messages = [...messages]
  }

  registerContextProvider(provider: AIContextProvider): void {
    this.contextProviders.push(provider)
  }

  unregisterContextProvider(id: string): void {
    this.contextProviders = this.contextProviders.filter(p => p.id !== id)
  }

  async getContextForConnection(connectionId: string): Promise<string> {
    const parts: string[] = []
    for (const cp of this.contextProviders) {
      if (cp.appliesTo(connectionId)) {
        try {
          const ctx = await cp.getContext(connectionId)
          if (ctx) parts.push(ctx)
        } catch {
          // Context provider failed
        }
      }
    }
    return parts.join('\n\n')
  }

  async assembleSystemMessage(
    connectionMeta?: { type: string; driverName: string },
    connectionIdOverride?: string | null,
    appActionsCatalog?: string,
    connectionsSummary?: string,
    notificationsSummary?: string
  ): Promise<string> {
    // The prompt template + fragments live in `../prompts/*.md`. This method
    // only resolves the dynamic data (schema context, plugin-contributed
    // context) — no prompt text lives in this file.
    let schema = ''
    let conversationContext = ''

    const connectionId = connectionIdOverride !== undefined ? connectionIdOverride : this.deps.getConnectionId()
    if (connectionId) {
      try {
        schema = await this.deps.getSchemaContext(connectionId)
      } catch {
        // Schema unavailable
      }

      const ctxParts: string[] = []
      for (const cp of this.contextProviders) {
        if (cp.appliesTo(connectionId)) {
          try {
            const ctx = await cp.getContext(connectionId)
            if (ctx) ctxParts.push(ctx)
          } catch {
            // Context provider failed
          }
        }
      }
      conversationContext = ctxParts.join('\n\n')
    }

    return buildChatSystemPrompt({
      connection: connectionMeta,
      schema,
      conversationContext,
      connectionsList: connectionsSummary,
      notificationsList: notificationsSummary,
      appActionsCatalog,
    })
  }

  async *chat(opts?: {
    connectionId?: string
    connectionMeta?: { type: string; driverName: string }
    appActionsCatalog?: string
    connectionsSummary?: string
    notificationsSummary?: string
  }): AsyncIterable<AIStreamEvent> {
    const provider = this.deps.providerRegistry.getActive()
    if (!provider) throw new Error('No active AI provider')

    const modelId = this.deps.providerRegistry.getActiveModel()
    if (!modelId) throw new Error('No active AI model')

    // The renderer is the source of truth for the active connection and sends
    // it per request. Fall back to the ambient id only when none was supplied.
    const connectionId = opts?.connectionId ?? this.deps.getConnectionId()

    this.abortController = new AbortController()
    const systemMessage = await this.assembleSystemMessage(opts?.connectionMeta, connectionId, opts?.appActionsCatalog, opts?.connectionsSummary, opts?.notificationsSummary)

    const tools = provider.supportsToolCalling
      ? this.deps.toolRegistry.getToolDefinitions()
      : undefined

    const MAX_TOOL_ROUNDS = 10
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (this.abortController.signal.aborted) break

      // Send the system prompt plus as much recent history as fits the budget.
      // The full history stays in `this.messages` for display/persistence; only
      // the request payload is trimmed, so the model never sees an unbounded
      // (and increasingly expensive) transcript.
      const maxContext = this.deps.maxContextTokens ?? DEFAULT_MAX_CONTEXT_TOKENS
      const historyBudget = Math.max(MIN_HISTORY_TOKENS, maxContext - estimateTokens(systemMessage))
      const history = trimMessagesToBudget(this.messages, historyBudget)
      const allMessages: AIChatMessage[] = [
        { id: 'system', role: 'system', content: systemMessage, timestamp: 0 },
        ...history
      ]

      const stream = provider.chat({
        model: modelId,
        messages: allMessages,
        tools: tools?.length ? tools : undefined,
        signal: this.abortController.signal
      })

      let assistantContent = ''
      const toolCalls: { call: AIToolCallRequest; resultContent: string }[] = []

      for await (const chunk of stream) {
        if (this.abortController.signal.aborted) break

        if (chunk.type === 'text' && chunk.content) {
          assistantContent += chunk.content
          yield { type: 'chunk', content: chunk.content }
        } else if (chunk.type === 'tool-call' && chunk.toolCall) {
          yield { type: 'tool-call', toolCall: chunk.toolCall }

          const tool = this.deps.toolRegistry.get(chunk.toolCall.name)
          if (!tool) {
            const resultContent = JSON.stringify({ error: `Unknown tool: ${chunk.toolCall.name}` })
            toolCalls.push({ call: chunk.toolCall, resultContent })
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: chunk.toolCall.name,
              success: false,
              data: null,
              display: `Unknown tool: ${chunk.toolCall.name}`
            }}
            continue
          }

          let params: Record<string, unknown>
          try {
            params = JSON.parse(chunk.toolCall.arguments || '{}') as Record<string, unknown>
          } catch {
            const resultContent = JSON.stringify({ error: 'Failed to parse tool arguments' })
            toolCalls.push({ call: chunk.toolCall, resultContent })
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: chunk.toolCall.name,
              success: false,
              data: null,
              display: 'Failed to parse tool arguments'
            }}
            continue
          }

          if (this.deps.permissionManager.isWriteBlocked(tool)) {
            const blockedMsg = 'Blocked: this tool requires write access and the current permission profile is read-only.'
            const resultContent = JSON.stringify({ error: blockedMsg })
            toolCalls.push({ call: chunk.toolCall, resultContent })
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: chunk.toolCall.name,
              success: false,
              data: null,
              display: blockedMsg
            }}
            continue
          }

          if (this.deps.permissionManager.needsApproval(tool)) {
            const display = tool.description + ': ' + JSON.stringify(params)
            const requestId = this.deps.permissionManager.createApprovalRequest(
              tool.id, params, display
            )
            yield { type: 'approval-request', request: {
              requestId,
              toolName: tool.name,
              toolDescription: tool.description,
              parameters: params,
              display
            }}

            const approved = await this.deps.permissionManager.waitForApproval(requestId)
            if (!approved) {
              const resultContent = JSON.stringify({ error: 'User rejected this action' })
              toolCalls.push({ call: chunk.toolCall, resultContent })
              yield { type: 'tool-result', result: {
                toolCallId: chunk.toolCall.id,
                toolName: chunk.toolCall.name,
                success: false,
                data: null,
                display: 'User rejected this action'
              }}
              continue
            }
          }

          try {
            const result = await this.deps.toolRegistry.execute(
              tool.id,
              params,
              { connectionId, abortSignal: this.abortController.signal }
            )
            const resultContent = JSON.stringify({ success: result.success, data: result.data })
            toolCalls.push({ call: chunk.toolCall, resultContent })
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: tool.name,
              success: result.success,
              data: result.data,
              display: result.display
            }}
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err)
            const resultContent = JSON.stringify({ error: errMsg })
            toolCalls.push({ call: chunk.toolCall, resultContent })
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: chunk.toolCall.name,
              success: false,
              data: null,
              display: errMsg
            }}
          }
        } else if (chunk.type === 'error') {
          yield { type: 'error', error: chunk.error ?? 'Unknown error' }
        } else if (chunk.type === 'done') {
          if (chunk.usage) {
            totalInputTokens += chunk.usage.inputTokens
            totalOutputTokens += chunk.usage.outputTokens
          }
          break
        }
      }

      // Save assistant message (with any tool calls) to history
      if (assistantContent || toolCalls.length > 0) {
        this.messages.push({
          id: randomUUID(),
          role: 'assistant',
          content: assistantContent,
          toolCalls: toolCalls.length > 0 ? toolCalls.map(tc => tc.call) : undefined,
          timestamp: Date.now()
        })
      }

      // Save tool result messages to history
      for (const tc of toolCalls) {
        this.messages.push({
          id: randomUUID(),
          role: 'tool',
          content: tc.resultContent,
          toolCallId: tc.call.id,
          timestamp: Date.now()
        })
      }

      // If no tool calls were made, the model is done — stop looping
      if (toolCalls.length === 0) break

      // Otherwise loop back so the provider can process tool results
    }

    const usage = (totalInputTokens > 0 || totalOutputTokens > 0)
      ? { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
      : undefined
    yield { type: 'done', usage }
  }

  abort(): void {
    this.abortController?.abort()
  }
}
