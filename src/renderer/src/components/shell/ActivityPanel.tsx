import { useEffect, useMemo, useState } from 'react'
import { Database, Wrench, Plug, Bell, Globe, Trash2 } from 'lucide-react'
import { Flex, Box, Text, cn } from '@/primitives'
import { useActivityStore } from '@/stores/activity'
import type { ActivityEntry, ActivityKind, ActivityLevel } from '@shared/activity'

const KIND_META: Record<ActivityKind, { icon: typeof Database; label: string }> = {
  query: { icon: Database, label: 'Queries' },
  'tool-call': { icon: Wrench, label: 'Tools' },
  connection: { icon: Plug, label: 'Connections' },
  notification: { icon: Bell, label: 'Notifications' },
  network: { icon: Globe, label: 'Network' },
}

const LEVEL_CLASS: Record<ActivityLevel, string> = {
  error: 'text-error',
  warn: 'text-warning',
  success: 'text-success',
  info: 'text-text-muted',
}

const ALL_KINDS = Object.keys(KIND_META) as ActivityKind[]

/** Cap rendered rows so a long stream stays smooth; the store keeps more. */
const MAX_RENDERED = 400

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const [open, setOpen] = useState(false)
  const { icon: Icon } = KIND_META[entry.kind]
  const hasDetail = Boolean(entry.detail)
  return (
    <Box
      className={cn(
        'px-3 py-1.5 border-b border-border/50 text-xs',
        hasDetail && 'cursor-pointer hover:bg-white/[0.03]',
      )}
      onClick={hasDetail ? () => setOpen((o) => !o) : undefined}
    >
      <Flex align="center" gap="sm" className="min-w-0">
        <Icon size={13} className={cn('shrink-0', LEVEL_CLASS[entry.level])} />
        <span className="font-mono text-[10px] text-text-muted shrink-0 tabular-nums">
          {formatTime(entry.ts)}
        </span>
        <span className={cn('truncate flex-1 min-w-0', entry.level === 'error' && 'text-error')}>
          {entry.title}
        </span>
        {entry.source && (
          <span className="text-[10px] text-text-muted shrink-0 max-w-[40%] truncate">
            {entry.source}
          </span>
        )}
      </Flex>
      {open && hasDetail && (
        <pre className="mt-1.5 ml-[21px] whitespace-pre-wrap break-words font-mono text-[10px] text-text-secondary bg-bg-inset rounded p-2 max-h-48 overflow-auto">
          {entry.detail}
        </pre>
      )}
    </Box>
  )
}

export interface ActivityListProps {
  entries: ActivityEntry[]
  /** Active kind filters; empty set = show all. */
  active: Set<ActivityKind>
  onToggleKind: (kind: ActivityKind) => void
  onClear: () => void
}

/** Presentational, store-free — used by the panel and Storybook. */
export function ActivityList({ entries, active, onToggleKind, onClear }: ActivityListProps) {
  const filtered = useMemo(() => {
    const list = active.size === 0 ? entries : entries.filter((e) => active.has(e.kind))
    return list.slice(0, MAX_RENDERED)
  }, [entries, active])

  return (
    <Flex direction="column" className="h-full min-h-0">
      <Flex align="center" gap="xs" className="px-2 py-1.5 border-b border-border shrink-0 flex-wrap">
        {ALL_KINDS.map((kind) => {
          const on = active.has(kind)
          const { icon: Icon, label } = KIND_META[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onToggleKind(kind)}
              title={label}
              className={cn(
                'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
                on ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-white/5',
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          )
        })}
        <span className="flex-1" />
        <button
          type="button"
          onClick={onClear}
          title="Clear activity"
          className="flex items-center rounded p-1 text-text-muted hover:text-error hover:bg-white/5"
        >
          <Trash2 size={13} />
        </button>
      </Flex>

      <Box className="flex-1 min-h-0 overflow-auto">
        {filtered.length === 0 ? (
          <Flex align="center" justify="center" className="h-full p-6">
            <Text size="sm" color="muted">No activity yet</Text>
          </Flex>
        ) : (
          filtered.map((e) => <ActivityRow key={e.id} entry={e} />)
        )}
      </Box>
    </Flex>
  )
}

/** Container: wires the live activity store. */
export function ActivityPanel() {
  const entries = useActivityStore((s) => s.entries)
  const init = useActivityStore((s) => s.init)
  const clear = useActivityStore((s) => s.clear)
  const [active, setActive] = useState<Set<ActivityKind>>(new Set())

  useEffect(() => { void init() }, [init])

  const toggle = (kind: ActivityKind) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })

  return <ActivityList entries={entries} active={active} onToggleKind={toggle} onClear={() => void clear()} />
}
