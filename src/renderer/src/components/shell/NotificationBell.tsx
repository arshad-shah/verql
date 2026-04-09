import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/primitives/utils/cn'

export function NotificationBell() {
  const { panelOpen, togglePanel, unreadCount } = useNotificationsStore()
  const unread = unreadCount()

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className={cn(
          'flex items-center rounded-md border px-2 py-1 transition-colors',
          panelOpen
            ? 'border-accent/30 bg-accent/10'
            : 'border-border-default bg-bg-tertiary hover:bg-hover'
        )}
      >
        <Bell
          size={12}
          className={cn(panelOpen ? 'text-accent' : 'text-text-secondary')}
        />
        {unread > 0 && (
          <div className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-error px-0.5 text-[7px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
      <NotificationPanel />
    </div>
  )
}
