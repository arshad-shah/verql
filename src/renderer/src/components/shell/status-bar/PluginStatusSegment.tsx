import { Spinner } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import { StatusBarSegment } from './StatusBarSegment'
import { usePluginStatus } from './usePluginStatus'

export function PluginStatusSegment() {
  const status = usePluginStatus()
  if (status.loading) {
    return (
      <StatusBarSegment tone="default" side="right" aria-label="Plugins loading">
        <Spinner size="xs" label="Loading plugins" />
        <span className="text-[10px]">Loading…</span>
      </StatusBarSegment>
    )
  }
  const warn = status.failed > 0
  return (
    <StatusBarSegment
      tone="default"
      side="right"
      aria-label={warn ? `${status.failed} plugins failed` : `${status.active} plugins active`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', warn ? 'bg-warning' : 'bg-success')} />
      <span className="text-[10px]">
        {warn ? `${status.active}/${status.total} plugins` : `${status.active} plugins`}
      </span>
    </StatusBarSegment>
  )
}
