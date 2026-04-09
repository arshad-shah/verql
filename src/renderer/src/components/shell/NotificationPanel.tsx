import { useEffect, useRef } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationItem } from './NotificationItem'
import { Bell } from 'lucide-react'
import { cn } from '@/primitives/utils/cn'

const categoryOrder = ['error', 'warning', 'info', 'success'] as const

const categoryLabels: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
  success: 'Success',
}

const categoryColors: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

export function NotificationPanel() {
  const { notifications, panelOpen, closePanel, markRead, markAllRead, unreadCount } =
    useNotificationsStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const unread = unreadCount()

  useEffect(() => {
    if (!panelOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
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
        'fixed bottom-9.5 right-0 w-80 max-h-87.5 overflow-y-auto z-50',
        'bg-bg-secondary border border-border-default border-b-0',
        'rounded-t-lg shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
        'animate-in slide-in-from-bottom-2 duration-150'
      )}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-default">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-error/15 px-1.5 py-px text-[9px] font-semibold text-error">
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-accent hover:text-accent-hover">
              Mark all read
            </button>
          )}
          <button onClick={closePanel} className="text-[10px] text-text-tertiary hover:text-text-secondary">
            ✕
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
          <Bell size={24} className="text-text-disabled" />
          <span className="text-[11px] text-text-tertiary">All caught up</span>
          <span className="text-[10px] text-text-disabled">No new notifications</span>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category}>
            <div className={cn('px-3.5 pt-2 pb-0.5 text-[9px] uppercase tracking-wider font-semibold', categoryColors[group.category])}>
              {categoryLabels[group.category]}
            </div>
            {group.items.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
