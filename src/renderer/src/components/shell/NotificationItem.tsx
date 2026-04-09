import { cn } from '@/primitives/utils/cn'
import type { Notification } from '@/stores/notifications'

const dotColorMap: Record<Notification['type'], string> = {
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationItemProps {
  notification: Notification
  onClick: (id: string) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { id, type, message, source, timestamp, read } = notification

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick(id)
      }}
      className={cn(
        'flex items-start gap-2 px-3.5 py-1.5 cursor-pointer border-b border-white/[0.03] hover:bg-hover',
        read && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
          dotColorMap[type],
          read && 'opacity-40'
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-text-primary truncate">{message}</div>
        <div className="mt-0.5 text-[9px] text-text-tertiary">
          {source && <span>{source.label} · </span>}
          {formatRelativeTime(timestamp)}
        </div>
      </div>
    </div>
  )
}
