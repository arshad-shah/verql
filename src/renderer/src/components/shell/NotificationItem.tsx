import { Notification as CynosureNotification } from '@arshad-shah/cynosure-react/notification'
import { formatRelativeTime } from '@/lib/format-time'
import type { Notification } from '@/stores/notifications'

const dotColorMap: Record<Notification['type'], string> = {
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
}

interface NotificationItemProps {
  notification: Notification
  onClick: (id: string) => void
}

/** Compact entry in the notification dropdown — a Cynosure Notification with
 *  the type signalled through a coloured dot in the icon slot. */
export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { id, type, message, source, timestamp, read } = notification

  return (
    <CynosureNotification
      icon={<span className={`block h-1.5 w-1.5 rounded-full ${dotColorMap[type]}`} aria-hidden="true" />}
      title={message}
      description={source?.label}
      timestamp={formatRelativeTime(timestamp)}
      unread={!read}
      onRead={() => onClick(id)}
    />
  )
}
