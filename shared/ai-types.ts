// shared/ai-types.ts

export interface AIChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: AIToolCallRequest[]
  toolCallId?: string
  timestamp: number
}

export interface AIToolCallRequest {
  id: string
  name: string
  arguments: string // JSON string
}

export interface AIChatChunk {
  type: 'text' | 'tool-call' | 'done' | 'error'
  content?: string
  toolCall?: AIToolCallRequest
  error?: string
}

export interface AIApprovalRequest {
  requestId: string
  toolName: string
  toolDescription: string
  parameters: Record<string, unknown>
  display: string // Human-readable preview
}

export interface AIToolCallResult {
  toolCallId: string
  toolName: string
  success: boolean
  data: unknown
  display?: string
}

export type AIStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'tool-call'; toolCall: AIToolCallRequest }
  | { type: 'tool-result'; result: AIToolCallResult }
  | { type: 'approval-request'; request: AIApprovalRequest }
  | { type: 'done' }
  | { type: 'error'; error: string }

export interface AIModelInfo {
  id: string
  name: string
  contextWindow: number
  capabilities: ('chat' | 'tool-calling')[]
}

export interface AIProviderInfo {
  id: string
  name: string
}

export interface AIChatStartRequest {
  message: string
  connectionId?: string
  connectionMeta?: { type: string; driverName: string }
}
