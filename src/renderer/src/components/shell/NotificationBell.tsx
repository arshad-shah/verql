import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'
import { Box, IconButton, BadgeIndicator, Tooltip } from '@/primitives'
import { cn } from '@/primitives/utils/cn'

export function NotificationBell() {
  const unread = useNotificationsStore((s) => s.unreadCount())
  const { secondarySidebarVisible, secondaryActivePanel, setSecondaryActivePanel } = useUiStore()
  const isActive = secondarySidebarVisible && secondaryActivePanel === 'notifications'

  return (
    <Box>
      <Tooltip content="Notifications" side="left">
        <BadgeIndicator variant="number" count={unread} side="top-left">
          <IconButton
            onClick={() => setSecondaryActivePanel('notifications')}
            variant={isActive ? 'outline' : 'ghost'}
            size="lg"
            label="Notifications"
            className={cn(
              'rounded-lg transition-colors',
              isActive
                ? 'bg-accent/10 text-accent hover:bg-accent/10'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            )}
          >
            <Bell size={20} />
          </IconButton>
        </BadgeIndicator>
      </Tooltip>
    </Box>
  )
}
