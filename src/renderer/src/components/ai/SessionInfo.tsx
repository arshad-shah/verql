import { useState } from 'react'
import { ChevronDown, ChevronRight, MessageSquare, Wrench, Zap } from 'lucide-react'
import { useAIStore } from '@/stores/ai'
import { Text } from '@/primitives/typography/Text'

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function SessionInfo() {
  const [expanded, setExpanded] = useState(false)
  const messages = useAIStore(s => s.messages)
  const activeProvider = useAIStore(s => s.activeProvider)
  const activeModel = useAIStore(s => s.activeModel)
  const models = useAIStore(s => s.models)
  const stats = useAIStore(s => s.sessionStats)

  const userMsgCount = messages.filter(m => m.role === 'user').length
  const assistantMsgCount = messages.filter(m => m.role === 'assistant' && !m.toolCalls?.length).length
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens
  const hasTokens = totalTokens > 0
  const contextWindow = models.find(m => m.id === activeModel)?.contextWindow ?? null
  const ctxPct = contextWindow && contextWindow > 0
    ? Math.min(100, Math.round((totalTokens / contextWindow) * 100))
    : 0

  if (messages.length === 0) return null

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setExpanded(s => !s)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-hover)] transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={10} className="text-[var(--color-text-tertiary)] shrink-0" />
        ) : (
          <ChevronRight size={10} className="text-[var(--color-text-tertiary)] shrink-0" />
        )}
        <div className="flex-1 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1">
            <MessageSquare size={9} />
            {userMsgCount + assistantMsgCount}
          </span>
          {stats.toolCallCount > 0 && (
            <span className="flex items-center gap-1">
              <Wrench size={9} />
              {stats.toolCallCount}
            </span>
          )}
          {hasTokens && (
            <span className="flex items-center gap-1">
              <Zap size={9} />
              {formatTokens(totalTokens)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)] truncate max-w-[120px]">
          {activeModel ?? 'No model'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          {/* Provider & Model */}
          <div className="flex justify-between text-[10px]">
            <Text size="xs" color="secondary">Provider</Text>
            <Text size="xs">{activeProvider?.name ?? 'None'}</Text>
          </div>
          <div className="flex justify-between text-[10px]">
            <Text size="xs" color="secondary">Model</Text>
            <Text size="xs" className="truncate max-w-[180px]">{activeModel ?? 'None'}</Text>
          </div>

          {/* Message counts */}
          <div className="h-px bg-[var(--color-border)] my-1" />
          <div className="flex justify-between text-[10px]">
            <Text size="xs" color="secondary">Messages</Text>
            <Text size="xs">{userMsgCount} sent / {assistantMsgCount} received</Text>
          </div>
          {stats.toolCallCount > 0 && (
            <div className="flex justify-between text-[10px]">
              <Text size="xs" color="secondary">Tool calls</Text>
              <Text size="xs">{stats.toolCallCount}</Text>
            </div>
          )}

          {/* Token usage */}
          {hasTokens && (
            <>
              <div className="h-px bg-[var(--color-border)] my-1" />
              <div className="flex justify-between text-[10px]">
                <Text size="xs" color="secondary">Input tokens</Text>
                <Text size="xs">{formatTokens(stats.totalInputTokens)}</Text>
              </div>
              <div className="flex justify-between text-[10px]">
                <Text size="xs" color="secondary">Output tokens</Text>
                <Text size="xs">{formatTokens(stats.totalOutputTokens)}</Text>
              </div>
              <div className="flex justify-between text-[10px]">
                <Text size="xs" color="secondary">Total tokens</Text>
                <Text size="xs" weight="medium">{formatTokens(totalTokens)}</Text>
              </div>
            </>
          )}

          {/* Context window */}
          {contextWindow != null && (
            <>
              <div className="h-px bg-[var(--color-border)] my-1" />
              <div className="flex justify-between text-[10px]">
                <Text size="xs" color="secondary">Context window</Text>
                <Text size="xs">{formatTokens(totalTokens)} / {formatTokens(contextWindow)}</Text>
              </div>
              <div className="h-1 rounded bg-[var(--color-bg-tertiary)] overflow-hidden">
                <div
                  className={ctxPct >= 90 ? 'h-full bg-error' : ctxPct >= 70 ? 'h-full bg-warning' : 'h-full bg-accent'}
                  style={{ width: `${ctxPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px]">
                <Text size="xs" color="secondary">Remaining</Text>
                <Text size="xs">{formatTokens(Math.max(0, contextWindow - totalTokens))}</Text>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
