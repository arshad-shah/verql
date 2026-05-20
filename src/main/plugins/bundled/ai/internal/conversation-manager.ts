// src/main/ai/conversation-manager.ts
import { randomUUID } from 'crypto'
import type { AIChatMessage, AIStreamEvent, AIToolCallRequest } from '@shared/ai-types'
import type { AIContextProvider } from './types'
import type { AIProviderRegistry } from './provider-registry'
import type { AIToolRegistry } from './tool-registry'
import type { PermissionManager } from './permission-manager'

interface ConversationManagerDeps {
  providerRegistry: AIProviderRegistry
  toolRegistry: AIToolRegistry
  permissionManager: PermissionManager
  getSchemaContext: (connectionId: string) => Promise<string>
  getConnectionId: () => string | null
}

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

  async assembleSystemMessage(connectionMeta?: { type: string; driverName: string }): Promise<string> {
    const parts: string[] = [
      `You are a concise database assistant inside a desktop database client. Help users with schemas, queries, analysis, and debugging.

Rules:
- Be brief. Short sentences, no filler, no greetings, no emoji.
- Answer directly — do not list your capabilities or offer generic help.
- Only help with database-related tasks. Decline everything else in one sentence.
- Never write application code (no React, Python, JS, etc.).
- Prefer safe read operations. Only run destructive operations if the user explicitly confirms.
- Do not invent data — only reference the schema or query results.`
    ]

    if (connectionMeta) {
      parts.push(`The user is connected to a ${connectionMeta.driverName} database (type: ${connectionMeta.type}). Generate queries and commands appropriate for this database system.`)
    }

    const connectionId = this.deps.getConnectionId()
    if (connectionId) {
      try {
        const schemaContext = await this.deps.getSchemaContext(connectionId)
        if (schemaContext) {
          parts.push(`\nCurrent database schema:\n${schemaContext}`)
        }
      } catch {
        // Schema unavailable
      }

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
    }

    return parts.join('\n\n')
  }

  async *chat(connectionMeta?: { type: string; driverName: string }): AsyncIterable<AIStreamEvent> {
    const provider = this.deps.providerRegistry.getActive()
    if (!provider) throw new Error('No active AI provider')

    const modelId = this.deps.providerRegistry.getActiveModel()
    if (!modelId) throw new Error('No active AI model')

    this.abortController = new AbortController()
    const systemMessage = await this.assembleSystemMessage(connectionMeta)

    const tools = provider.supportsToolCalling
      ? this.deps.toolRegistry.getToolDefinitions()
      : undefined

    const MAX_TOOL_ROUNDS = 10
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (this.abortController.signal.aborted) break

      const allMessages: AIChatMessage[] = [
        { id: 'system', role: 'system', content: systemMessage, timestamp: 0 },
        ...this.messages
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
              { connectionId: this.deps.getConnectionId(), abortSignal: this.abortController.signal }
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
