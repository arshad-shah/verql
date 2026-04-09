import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationPanel } from './NotificationPanel'
import { Box, IconButton, Badge, BadgeIndicator } from '@/primitives'

export function NotificationBell() {
  const { panelOpen, togglePanel, unreadCount } = useNotificationsStore()
  const unread = unreadCount()

  return (
    <Box className="relative">
      <BadgeIndicator variant={'number'} count={unread} >

        <IconButton
          onClick={togglePanel}
          variant={panelOpen ? 'outline' : 'ghost'}
          size="lg"
          label="Notifications"
          className={panelOpen ? 'border-accent/30 bg-accent/10' : ''}
        >
          <Bell size={12} />
        </IconButton>
      </BadgeIndicator>

      <NotificationPanel />
    </Box>
  )
}
