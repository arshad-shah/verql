import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, ShieldQuestion, Loader2 } from 'lucide-react'
import type { AIChatMessage } from '@shared/ai-types'
import { useAIStore } from '@/stores/ai'
import { Text } from '@/primitives/typography/Text'
import { CodeBlock } from './CodeBlock'

interface ToolCallCardProps {
  message: AIChatMessage
  result?: AIChatMessage
}

function extractQuery(args: string): string | null {
  try {
    const parsed = JSON.parse(args) as Record<string, unknown>
    if (parsed.query) return String(parsed.query)
    if (parsed.sql) return String(parsed.sql)
    return null
  } catch {
    return null
  }
}

function guessLanguage(query: string): string {
  try {
    JSON.parse(query)
    return 'json'
  } catch {
    return 'sql'
  }
}

function parseToolResult(content: string): { success: boolean; summary: string; detail?: string } {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    if (parsed.error) {
      return { success: false, summary: String(parsed.error) }
    }
    if (parsed.data && typeof parsed.data === 'object' && parsed.data !== null) {
      const data = parsed.data as Record<string, unknown>
      if (data.rowCount !== undefined) {
        return { success: true, summary: `${data.rowCount} row(s) returned` }
      }
    }
    return { success: Boolean(parsed.success), summary: content }
  } catch {
    // Not JSON — use the display string as-is
    return { success: !content.toLowerCase().startsWith('error'), summary: content }
  }
}

function getToolLabel(name: string): string {
  if (name.includes('execute') || name.includes('query')) return 'Query Execution'
  if (name.includes('explain')) return 'Query Explain'
  if (name.includes('schema') || name.includes('table') || name.includes('list')) return 'Schema Lookup'
  return name
}

export function ToolCallCard({ message, result }: ToolCallCardProps) {
  const [showCode, setShowCode] = useState(false)
  const toolCall = message.toolCalls?.[0]
  if (!toolCall) return null

  const pendingApproval = useAIStore(s => s.pendingApproval)

  const query = extractQuery(toolCall.arguments)
  const label = getToolLabel(toolCall.name)
  const parsed = result ? parseToolResult(result.content) : null
  const isWaitingApproval = !result && pendingApproval !== null
  const isExecuting = !result && pendingApproval === null

  return (
    <div className="mb-3 mx-2 rounded-lg border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowCode(s => !s)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] hover:bg-[var(--color-hover)] transition-colors text-left"
      >
        {isWaitingApproval ? (
          <ShieldQuestion size={12} className="text-warning shrink-0" />
        ) : isExecuting ? (
          <Loader2 size={12} className="text-[var(--color-accent)] shrink-0 animate-spin" />
        ) : parsed?.success ? (
          <CheckCircle2 size={12} className="text-[var(--color-success)] shrink-0" />
        ) : (
          <XCircle size={12} className="text-[var(--color-error)] shrink-0" />
        )}
        <span className="flex-1 text-xs font-medium text-[var(--color-text)]">{label}</span>
        {isWaitingApproval && (
          <span className="text-[10px] text-warning">Awaiting approval</span>
        )}
        {isExecuting && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">Running</span>
        )}
        {parsed && (
          <span className={`text-[10px] ${parsed.success ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
            {parsed.success ? 'Done' : 'Failed'}
          </span>
        )}
        {showCode ? (
          <ChevronDown size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
        )}
      </button>

      {/* Query code */}
      {showCode && query && (
        <div className="px-3 pt-2">
          <CodeBlock code={query} language={guessLanguage(query)} alwaysShowInsert />
        </div>
      )}

      {/* Result */}
      {parsed && (
        <div className="px-3 py-2">
          <Text size="xs" color={parsed.success ? 'secondary' : 'error'}>
            {parsed.summary}
          </Text>
        </div>
      )}
    </div>
  )
}
