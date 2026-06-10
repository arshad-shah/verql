import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { useUiStore, SECONDARY_PANEL } from '@/stores/ui'
import { BadgeIndicator, Tooltip } from '@/primitives'
import { Box } from '@arshad-shah/cynosure-react/box'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { useTranslation } from '@/i18n/I18nProvider'

export function NotificationBell() {
  const { t } = useTranslation()
  const unread = useNotificationsStore((s) => s.unreadCount())
  const { secondarySidebarVisible, secondaryActivePanel, setSecondaryActivePanel } = useUiStore()
  const isActive = secondarySidebarVisible && secondaryActivePanel === SECONDARY_PANEL.NOTIFICATIONS

  return (
    <Box>
      <Tooltip content={t('shell.notifications.bell')} side="left">
        <BadgeIndicator variant="number" count={unread} side="top-left">
          <IconButton
            onClick={() => setSecondaryActivePanel(SECONDARY_PANEL.NOTIFICATIONS)}
            variant={isActive ? 'soft' : 'ghost'}
            colorScheme={isActive ? 'accent' : 'neutral'}
            size="lg"
            label={t('shell.notifications.bell')}
            className="rounded-lg"
            icon={<Bell size={20} />}
          />
        </BadgeIndicator>
      </Tooltip>
    </Box>
  )
}
