import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationPanel } from './NotificationPanel'
import { Box, IconButton, Badge } from '@/primitives'

export function NotificationBell() {
  const { panelOpen, togglePanel, unreadCount } = useNotificationsStore()
  const unread = unreadCount()

  return (
    <Box className="relative">
      <IconButton
        onClick={togglePanel}
        variant={panelOpen ? 'outline' : 'ghost'}
        size="sm"
        label="Notifications"
        className={panelOpen ? 'border-accent/30 bg-accent/10' : ''}
      >
        <Bell size={12} />
      </IconButton>
      {unread > 0 && (
        <Badge
          variant="error"
          size="sm"
          className="absolute -right-1 -top-1 h-3.5 min-w-3.5 px-0.5 text-[7px]"
        >
          {unread > 9 ? '9+' : unread}
        </Badge>
      )}
      <NotificationPanel />
    </Box>
  )
}
