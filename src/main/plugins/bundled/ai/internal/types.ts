import type { AIChatMessage, AIToolCallRequest } from '@shared/ai-types'

// ─── Provider ────────────────────────────────────────────────────────────────

export interface AIProvider {
  id: string
  name: string
  models(): Promise<AIProviderModel[]>
  chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk>
  supportsToolCalling: boolean
}

export interface AIProviderModel {
  id: string
  name: string
  contextWindow: number
  capabilities: ('chat' | 'tool-calling')[]
}

export interface AIProviderChatRequest {
  model: string
  messages: AIChatMessage[]
  tools?: AIToolDefinition[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
}

export interface AIToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface AIProviderChunk {
  type: 'text' | 'tool-call' | 'done' | 'error'
  content?: string
  toolCall?: AIToolCallRequest
  error?: string
  usage?: { inputTokens: number; outputTokens: number }
}

// ─── Context Provider ────────────────────────────────────────────────────────

export interface AIContextProvider {
  id: string
  appliesTo(connectionId: string): boolean
  getContext(connectionId: string): Promise<string>
}
