import { useEffect, useRef } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationItem } from './NotificationItem'
import { Bell, X } from 'lucide-react'
import { cn } from '@/primitives/utils/cn'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
} from '@arshad-shah/cynosure-react/empty-state'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { useTranslation } from '@/i18n/I18nProvider'
import type { MessageKey } from '@shared/i18n'

const categoryOrder = ['error', 'warning', 'info', 'success'] as const

const categoryLabels: Record<string, MessageKey> = {
  error: 'shell.notifications.categoryErrors',
  warning: 'shell.notifications.categoryWarnings',
  info: 'shell.notifications.categoryInfo',
  success: 'shell.notifications.categorySuccess',
}

const categoryColors: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

export function NotificationPanel() {
  const { t } = useTranslation()
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotificationsStore()
  // Panel open/close is now driven by the secondary-sidebar UI store. This
  // component renders inside that sidebar and shouldn't dismiss itself —
  // closing the sidebar is the user's job via the activity bar / Esc handler
  // in the shell.
  const panelOpen = true
  const closePanel = () => {}
  const panelRef = useRef<HTMLDivElement>(null)
  const unread = unreadCount()

  useEffect(() => {
    if (!panelOpen) return
    const handleKeyDown = (_e: KeyboardEvent) => { /* no-op */ }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen, closePanel])

  useEffect(() => {
    if (!panelOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [panelOpen, closePanel])

  if (!panelOpen) return null

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: notifications.filter((n) => n.type === cat),
    }))
    .filter((g) => g.items.length > 0)

  const handleItemClick = (id: string) => {
    markRead(id)
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute bottom-0 left-full ml-2 w-80 max-h-96 overflow-y-auto z-50',
        'bg-bg-secondary border border-border-default',
        'rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
        'animate-in slide-in-from-left-2 duration-150'
      )}
    >
      <Flex
        align="center"
        justify="between"
        className="px-3.5 py-2.5 border-b border-border-default"
      >
        <Flex align="center" gap="2">
          <Text size="xs" weight="semibold">{t('shell.notifications.title')}</Text>
          {unread > 0 && (
            <Text
              size="xs"
              weight="semibold"
              color="feedback.danger.foreground"
              className="rounded-full bg-error/15 px-1.5 py-px text-[9px]"
            >
              {t('shell.notifications.newCount', { count: unread })}
            </Text>
          )}
        </Flex>
        <Flex align="center" gap="2">
          {unread > 0 && (
            <Button
              variant="ghost"
              colorScheme="accent"
              size="xs"
              onClick={markAllRead}
              className="text-[10px]"
            >
              {t('shell.notifications.markAllRead')}
            </Button>
          )}
          <IconButton
            variant="ghost"
            colorScheme="neutral"
            size="xs"
            onClick={closePanel}
            label={t('shell.notifications.close')}
            icon={<X size={12} />}
          />
        </Flex>
      </Flex>

      {grouped.length === 0 ? (
        <EmptyState variant="subtle" className="py-8 px-4">
          <EmptyStateIcon>
            <Bell size={24} className="text-text-disabled" />
          </EmptyStateIcon>
          <EmptyStateTitle>{t('shell.notifications.allCaughtUp')}</EmptyStateTitle>
          <EmptyStateDescription>{t('shell.notifications.emptyDescriptionNew')}</EmptyStateDescription>
        </EmptyState>
      ) : (
        grouped.map((group) => (
          <Box key={group.category}>
            <Text
              size="xs"
              weight="semibold"
              className={cn(
                'block px-3.5 pt-2 pb-0.5 text-[9px] uppercase tracking-wider',
                categoryColors[group.category]
              )}
            >
              {t(categoryLabels[group.category])}
            </Text>
            {group.items.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
            ))}
          </Box>
        ))
      )}
    </div>
  )
}
