import { useNotificationsStore, type Notification } from '@/stores/notifications'
import {
  Bell,
  Trash2,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
} from 'lucide-react'
import { Flex, Text, Button, Box, EmptyState } from '@/primitives'
import { cn } from '@/primitives/utils/cn'

const typeIcons: Record<Notification['type'], typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const typeColors: Record<Notification['type'], string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

const typeBgColors: Record<Notification['type'], string> = {
  error: 'bg-error/10',
  warning: 'bg-warning/10',
  info: 'bg-info/10',
  success: 'bg-success/10',
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

function NotificationItem({ notification }: { notification: Notification }) {
  const { markRead, removeNotification } = useNotificationsStore()
  const Icon = typeIcons[notification.type]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !notification.read && markRead(notification.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          !notification.read && markRead(notification.id)
        }
      }}
      className={cn(
        'group relative flex gap-2.5 px-3 py-2.5 cursor-default transition-colors',
        'hover:bg-white/[0.03]',
        !notification.read && 'bg-white/[0.02]'
      )}
    >
      {/* Unread indicator bar */}
      {!notification.read && (
        <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r bg-accent" />
      )}

      {/* Type icon */}
      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded',
          typeBgColors[notification.type]
        )}
      >
        <Icon size={12} className={typeColors[notification.type]} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Text
          size="xs"
          weight={notification.read ? 'normal' : 'medium'}
          color="primary"
          className="leading-tight"
        >
          {notification.title}
        </Text>

        {notification.message && (
          <Text
            size="xs"
            color="muted"
            className="mt-0.5 leading-snug line-clamp-2 break-words"
          >
            {notification.message}
          </Text>
        )}

        <Flex align="center" gap="xs" className="mt-1">
          {notification.source && (
            <>
              <Text
                size="xs"
                color="muted"
                className="text-[10px] truncate max-w-[120px]"
              >
                {notification.source.label}
              </Text>
              <span className="text-text-disabled text-[10px]">·</span>
            </>
          )}
          <Text size="xs" color="disabled" className="text-[10px] shrink-0">
            {formatRelativeTime(notification.timestamp)}
          </Text>
        </Flex>
      </div>

      {/* Dismiss button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeNotification(notification.id)
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded',
          'text-text-disabled hover:text-text-primary hover:bg-white/5',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
        aria-label="Dismiss notification"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function NotificationsSidebar() {
  const { notifications, markAllRead, clearAll, unreadCount } =
    useNotificationsStore()
  const unread = unreadCount()

  return (
    <div className="flex flex-col h-full">
      {/* Actions bar */}
      {notifications.length > 0 && (
        <Flex
          align="center"
          justify="end"
          gap="xs"
          className="px-3 py-1.5 border-b border-border"
        >
          {unread > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={markAllRead}
              className="text-[10px] text-accent hover:text-accent-hover gap-1"
            >
              <CheckCheck size={10} />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={clearAll}
            className="text-[10px] text-text-muted hover:text-error gap-1"
          >
            <Trash2 size={10} />
            Clear
          </Button>
        </Flex>
      )}

      {/* Notification list — chronological order */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} className="text-text-disabled" />}
          title="All caught up"
          description="No notifications yet"
          className="py-12 px-4"
        />
      ) : (
        <div className="flex-1 divide-y divide-white/[0.04]">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
