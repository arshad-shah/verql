// src/main/ai/conversation-manager.ts
import { randomUUID } from 'crypto'
import type { AIChatMessage, AIStreamEvent } from '@shared/ai-types'
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

  async assembleSystemMessage(): Promise<string> {
    const parts: string[] = [
      'You are a helpful database assistant. You can query and inspect the connected database using the tools available to you.',
      'Always explain what you are doing and why. When generating SQL, prefer safe read operations unless the user explicitly asks for modifications.'
    ]

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

  async *chat(): AsyncIterable<AIStreamEvent> {
    const provider = this.deps.providerRegistry.getActive()
    if (!provider) throw new Error('No active AI provider')

    const modelId = this.deps.providerRegistry.getActiveModel()
    if (!modelId) throw new Error('No active AI model')

    this.abortController = new AbortController()
    const systemMessage = await this.assembleSystemMessage()

    const allMessages: AIChatMessage[] = [
      { id: 'system', role: 'system', content: systemMessage, timestamp: 0 },
      ...this.messages
    ]

    const tools = provider.supportsToolCalling
      ? this.deps.toolRegistry.getToolDefinitions()
      : undefined

    const stream = provider.chat({
      model: modelId,
      messages: allMessages,
      tools: tools?.length ? tools : undefined,
      signal: this.abortController.signal
    })

    let assistantContent = ''

    for await (const chunk of stream) {
      if (this.abortController.signal.aborted) break

      if (chunk.type === 'text' && chunk.content) {
        assistantContent += chunk.content
        yield { type: 'chunk', content: chunk.content }
      } else if (chunk.type === 'tool-call' && chunk.toolCall) {
        yield { type: 'tool-call', toolCall: chunk.toolCall }

        const tool = this.deps.toolRegistry.get(chunk.toolCall.name)
        if (!tool) {
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: chunk.toolCall.name,
            success: false,
            data: null,
            display: `Unknown tool: ${chunk.toolCall.name}`
          }}
          continue
        }

        const params = JSON.parse(chunk.toolCall.arguments) as Record<string, unknown>

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
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: tool.name,
            success: result.success,
            data: result.data,
            display: result.display
          }}
        } catch (err) {
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: tool.name,
            success: false,
            data: null,
            display: err instanceof Error ? err.message : String(err)
          }}
        }
      } else if (chunk.type === 'error') {
        yield { type: 'error', error: chunk.error ?? 'Unknown error' }
      } else if (chunk.type === 'done') {
        break
      }
    }

    if (assistantContent) {
      this.messages.push({
        id: randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      })
    }

    yield { type: 'done' }
  }

  abort(): void {
    this.abortController?.abort()
  }
}
