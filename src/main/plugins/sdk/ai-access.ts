// src/main/plugins/sdk/ai-access.ts
import type { Disposable } from './types'
import type { AITool, AIContextProvider, AIProvider } from '../../ai/types'
import type { AIToolRegistry } from '../../ai/tool-registry'
import type { AIProviderRegistry } from '../../ai/provider-registry'
import type { ConversationManager } from '../../ai/conversation-manager'

export interface AIAccess {
  registerTool(tool: AITool): Disposable
  registerProvider(provider: AIProvider): Disposable
  registerContextProvider(provider: AIContextProvider): Disposable
}

export class AIAccessImpl implements AIAccess {
  constructor(
    private toolRegistry: AIToolRegistry,
    private providerRegistry: AIProviderRegistry,
    private conversationManager: ConversationManager
  ) {}

  registerTool(tool: AITool): Disposable {
    this.toolRegistry.register(tool)
    return { dispose: () => this.toolRegistry.unregister(tool.id) }
  }

  registerProvider(provider: AIProvider): Disposable {
    this.providerRegistry.register(provider)
    return { dispose: () => this.providerRegistry.unregister(provider.id) }
  }

  registerContextProvider(provider: AIContextProvider): Disposable {
    this.conversationManager.registerContextProvider(provider)
    return { dispose: () => this.conversationManager.unregisterContextProvider(provider.id) }
  }
}
