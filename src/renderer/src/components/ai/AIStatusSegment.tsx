import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Popover } from '@/primitives/surfaces/Popover'
import { Text } from '@/primitives/typography/Text'
import { Flex } from '@/primitives/layout/Flex'
import { useAIStore } from '@/stores/ai'
import {
  getInlineAIState,
  subscribeInlineAIState,
  type InlineAIState,
} from '@/lib/monaco-ai-completion'
import { StatusBarSegment } from '@/components/shell/status-bar/StatusBarSegment'

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/**
 * AI segment for the status bar. Plugin-owned: the AI bundled plugin
 * contributes a host-component widget pointing at this id, and the renderer
 * mounts it inside the `app.statusBar.right` slot. The main app has no AI
 * knowledge — it only knows there's a host-component called `ai-status`.
 *
 * Visible states:
 *   - inline-AI idle + no chat activity → static Sparkles
 *   - inline-AI thinking → spinner
 *   - chat streaming → spinner
 * Click opens a popover with model, context-window usage bar, and totals.
 */
export function AIStatusSegment() {
  const [inlineState, setInlineState] = useState<InlineAIState>(() => getInlineAIState())
  useEffect(() => subscribeInlineAIState(setInlineState), [])

  const isStreaming = useAIStore((s) => s.isStreaming)
  const activeModelId = useAIStore((s) => s.activeModel)
  const activeProvider = useAIStore((s) => s.activeProvider)
  const models = useAIStore((s) => s.models)
  const stats = useAIStore((s) => s.sessionStats)

  const busy = inlineState === 'thinking' || isStreaming
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens
  const contextWindow = models.find((m) => m.id === activeModelId)?.contextWindow ?? null
  const pct = contextWindow && contextWindow > 0
    ? Math.min(100, Math.round((totalTokens / contextWindow) * 100))
    : 0

  const trigger = (
    <StatusBarSegment
      tone="default"
      side="right"
      aria-label={busy ? 'AI working' : 'AI status'}
    >
      {busy
        ? <Loader2 size={10} className="animate-spin text-accent" />
        : <Sparkles size={10} className={activeModelId ? 'text-accent' : 'text-text-muted'} />}
      <span className="text-[10px]">
        {busy
          ? (inlineState === 'thinking' ? 'completing' : 'chatting')
          : 'AI'}
      </span>
    </StatusBarSegment>
  )

  return (
    <Popover
      trigger={trigger}
      content={
        <div className="min-w-[240px] p-1 space-y-2">
          <Flex direction="column" gap="xs">
            <Flex align="center" gap="xs">
              <Sparkles size={12} className="text-accent" />
              <Text size="xs" weight="medium">AI</Text>
            </Flex>
            <Flex align="center" justify="between">
              <Text size="xs" color="muted">Provider</Text>
              <Text size="xs">{activeProvider?.name ?? 'None'}</Text>
            </Flex>
            <Flex align="center" justify="between">
              <Text size="xs" color="muted">Model</Text>
              <Text size="xs" className="truncate max-w-[160px]">{activeModelId ?? 'None'}</Text>
            </Flex>
          </Flex>

          {contextWindow != null ? (
            <Flex direction="column" gap="xs" className="pt-1 border-t border-border-default">
              <Flex align="center" justify="between">
                <Text size="xs" color="muted">Context window</Text>
                <Text size="xs">
                  {formatTokens(totalTokens)} / {formatTokens(contextWindow)}
                </Text>
              </Flex>
              <div className="h-1 rounded bg-bg-tertiary overflow-hidden">
                <div
                  className={pct >= 90 ? 'h-full bg-error' : pct >= 70 ? 'h-full bg-warning' : 'h-full bg-accent'}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <Text size="xs" color="muted">
                {formatTokens(Math.max(0, contextWindow - totalTokens))} remaining
              </Text>
            </Flex>
          ) : null}

          <Flex direction="column" gap="xs" className="pt-1 border-t border-border-default">
            <Flex align="center" justify="between">
              <Text size="xs" color="muted">Inline completion</Text>
              <Text size="xs">{inlineState === 'idle' ? 'idle' : inlineState}</Text>
            </Flex>
            <Flex align="center" justify="between">
              <Text size="xs" color="muted">Chat</Text>
              <Text size="xs">{isStreaming ? 'streaming' : 'idle'}</Text>
            </Flex>
          </Flex>
        </div>
      }
    />
  )
}
