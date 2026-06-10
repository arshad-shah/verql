import { type MouseEvent } from 'react'
import { useNotificationsStore, type Notification } from '@/stores/notifications'
import {
  Bell,
  Trash2,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
} from '@arshad-shah/cynosure-react/empty-state'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { Notification as CynosureNotification } from '@arshad-shah/cynosure-react/notification'
import { cn } from '@/primitives/utils/cn'
import { formatRelativeTime } from '@/lib/format-time'
import { useClipboard } from '@/hooks/useClipboard'
import { useTranslation } from '@/i18n/I18nProvider'

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

function buildCopyPayload(n: Notification): string {
  const parts = [n.title]
  if (n.message) parts.push(n.message)
  const sourceBits: string[] = []
  if (n.source) sourceBits.push(`source: ${n.source.label} (${n.source.type}:${n.source.id})`)
  sourceBits.push(`at: ${new Date(n.timestamp).toISOString()}`)
  parts.push(sourceBits.join(' · '))
  return parts.join('\n')
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { t } = useTranslation()
  const { markRead, removeNotification } = useNotificationsStore()
  const Icon = typeIcons[notification.type]
  const { copied, copy } = useClipboard()
  const isError = notification.type === 'error'

  return (
    <CynosureNotification
      icon={
        <span className={cn('flex h-5 w-5 items-center justify-center rounded', typeBgColors[notification.type])}>
          <Icon size={12} className={typeColors[notification.type]} />
        </span>
      }
      title={notification.title}
      description={
        notification.message ? (
          <span
            className={cn(
              'break-words',
              isError && 'font-mono whitespace-pre-wrap select-text cursor-text',
            )}
            onClick={isError ? (e) => e.stopPropagation() : undefined}
          >
            {notification.message}
          </span>
        ) : undefined
      }
      timestamp={
        <>
          {notification.source && <>{notification.source.label} · </>}
          {formatRelativeTime(notification.timestamp)}
        </>
      }
      unread={!notification.read}
      onRead={() => markRead(notification.id)}
      onDismiss={() => removeNotification(notification.id)}
      dismissLabel={t('shell.notifications.dismiss')}
      actions={
        isError ? (
          <IconButton
            variant="ghost"
            colorScheme="neutral"
            size="xs"
            label={copied ? t('shell.notifications.copied') : t('shell.notifications.copyErrorDetails')}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              copy(buildCopyPayload(notification), { resetDelay: 1500 })
            }}
            icon={copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          />
        ) : undefined
      }
    />
  )
}

export function NotificationsSidebar() {
  const { t } = useTranslation()
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
          gap="1"
          className="px-3 py-1.5 border-b border-border"
        >
          {unread > 0 && (
            <Button
              variant="ghost"
              colorScheme="accent"
              size="xs"
              onClick={markAllRead}
              leftIcon={<CheckCheck size={10} />}
              className="text-[10px]"
            >
              {t('shell.notifications.markAllRead')}
            </Button>
          )}
          <Button
            variant="ghost"
            colorScheme="danger"
            size="xs"
            onClick={clearAll}
            leftIcon={<Trash2 size={10} />}
            className="text-[10px]"
          >
            {t('shell.notifications.clear')}
          </Button>
        </Flex>
      )}

      {/* Notification list — chronological order */}
      {notifications.length === 0 ? (
        <EmptyState variant="subtle" className="py-12 px-4">
          <EmptyStateIcon>
            <Bell size={24} className="text-text-disabled" />
          </EmptyStateIcon>
          <EmptyStateTitle>{t('shell.notifications.allCaughtUp')}</EmptyStateTitle>
          <EmptyStateDescription>{t('shell.notifications.emptyDescription')}</EmptyStateDescription>
        </EmptyState>
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
