import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Sparkles, Loader2, Settings, Maximize2, Minimize2, Eye, Shield, Zap } from 'lucide-react'
import { Popover } from '@/primitives/surfaces/Popover'
import { Switch } from '@/primitives/forms/Switch'
import { Text } from '@/primitives/typography/Text'
import { useAIStore } from '@/stores/ai'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import {
  getInlineAIState,
  subscribeInlineAIState,
  isInlineCompletionEnabled,
  setInlineCompletionEnabled,
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
 * mounts it inside the `app.statusBar.right` slot.
 *
 * The trigger is icon-only (Sparkles or spinner). All detail lives in the
 * popover: provider, model, permission mode, context-window meter with
 * remaining tokens, inline-completion / chat status, and quick actions.
 */
export function AIStatusSegment() {
  const [inlineState, setInlineState] = useState<InlineAIState>(() => getInlineAIState())
  useEffect(() => subscribeInlineAIState(setInlineState), [])
  const [inlineEnabled, setInlineEnabled] = useState<boolean>(() => isInlineCompletionEnabled())

  const isStreaming = useAIStore((s) => s.isStreaming)
  const activeModelId = useAIStore((s) => s.activeModel)
  const activeProvider = useAIStore((s) => s.activeProvider)
  const models = useAIStore((s) => s.models)
  const stats = useAIStore((s) => s.sessionStats)
  const profile = useAIStore((s) => s.permissionProfile)
  const compact = useAIStore((s) => s.compactConversation)
  const setSecondaryActivePanel = useUiStore((s) => s.setSecondaryActivePanel)
  const openSettings = useTabsStore((s) => s.openSettings)

  const busy = inlineState === 'thinking' || isStreaming
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens
  const contextWindow = models.find((m) => m.id === activeModelId)?.contextWindow ?? null
  const pct = contextWindow && contextWindow > 0
    ? Math.min(100, Math.round((totalTokens / contextWindow) * 100))
    : 0
  const remaining = contextWindow != null ? Math.max(0, contextWindow - totalTokens) : 0

  const modeLabel = profile === 'read-only' ? 'Read-only' : profile === 'auto' ? 'Auto' : 'Ask write'
  const ModeIcon = profile === 'read-only' ? Eye : profile === 'auto' ? Zap : Shield

  const statusLabel = isStreaming ? 'streaming' : inlineState === 'thinking' ? 'thinking' : 'idle'
  const statusTone =
    isStreaming || inlineState === 'thinking'
      ? 'bg-accent/15 text-accent'
      : 'bg-success/15 text-success'

  const trigger = (
    <StatusBarSegment
      tone="default"
      side="right"
      aria-label={busy ? 'AI working' : 'AI status'}
    >
      {busy
        ? <Loader2 size={12} className="animate-spin text-accent" />
        : <Sparkles size={12} className={activeModelId ? 'text-accent' : 'text-text-muted'} />}
    </StatusBarSegment>
  )

  const popoverContent = (
    <div className="min-w-[260px] p-1 space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={12} className="text-accent" />
        <Text size="xs" weight="medium">AI</Text>
        <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${statusTone}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <Row label="Provider" value={activeProvider?.name ?? 'None'} />
      <Row label="Model"    value={activeModelId ?? 'None'} />
      <Row label="Mode" valueNode={
        <span className="inline-flex items-center gap-1 text-text-primary">
          <ModeIcon size={10} /> {modeLabel}
        </span>
      } />

      {contextWindow != null ? (
        <div className="rounded bg-bg-secondary p-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-accent">
            <span>Context window</span>
            <span className="font-mono text-text-primary text-[10.5px] normal-case tracking-normal">
              {formatTokens(totalTokens)} / {formatTokens(contextWindow)}
            </span>
          </div>
          <div className="h-1 rounded bg-bg-tertiary overflow-hidden">
            <div
              className={pct >= 90 ? 'h-full bg-error' : pct >= 70 ? 'h-full bg-warning' : 'h-full bg-accent'}
              style={{ width: `${pct}%` }}
            />
          </div>
          <Text size="xs" weight="medium" className={`block text-right ${pct >= 90 ? 'text-error' : pct >= 70 ? 'text-warning' : 'text-success'}`}>
            {formatTokens(remaining)} tokens remaining
          </Text>
        </div>
      ) : null}

      <Row label="Tool calls" value={String(stats.toolCallCount)} />
      <Row label="Inline completion" valueNode={
        <div className="inline-flex items-center gap-2">
          <Text size="xs" color="muted">
            {inlineEnabled ? (inlineState === 'thinking' ? 'thinking' : 'on') : 'off'}
          </Text>
          <Switch
            label="Toggle AI inline completion"
            checked={inlineEnabled}
            onChange={(e) => {
              const next = e.currentTarget.checked
              setInlineCompletionEnabled(next)
              setInlineEnabled(next)
            }}
          />
        </div>
      } />

      <div className="flex gap-1 pt-1 border-t border-border-default">
        <ActionBtn icon={Minimize2} label="Compact"   onClick={() => { void compact() }} />
        <ActionBtn icon={Maximize2} label="Open chat" onClick={() => setSecondaryActivePanel('plugin:ai-chat')} />
        <ActionBtn icon={Settings}  label="Settings"  onClick={() => openSettings()} />
      </div>
    </div>
  )

  return <Popover trigger={trigger} content={popoverContent} placement="top" />
}

function Row({ label, value, valueNode }: { label: string; value?: string; valueNode?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 py-0.5 text-[10.5px]">
      <Text size="xs" color="muted">{label}</Text>
      {valueNode ? valueNode : <Text size="xs" className="truncate max-w-[160px]">{value}</Text>}
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-border-default bg-bg-primary px-1.5 py-1 text-[10px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
    >
      <Icon size={10} /> {label}
    </button>
  )
}
