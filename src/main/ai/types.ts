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
}

// ─── Tool ────────────────────────────────────────────────────────────────────

export interface AITool {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
  permission: 'read' | 'write'
  execute(params: Record<string, unknown>, context: AIToolContext): Promise<AIToolExecutionResult>
}

export interface AIToolContext {
  connectionId: string | null
  abortSignal: AbortSignal
}

export interface AIToolExecutionResult {
  success: boolean
  data: unknown
  display?: string
}

// ─── Context Provider ────────────────────────────────────────────────────────

export interface AIContextProvider {
  id: string
  appliesTo(connectionId: string): boolean
  getContext(connectionId: string): Promise<string>
}
