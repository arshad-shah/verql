import { useEffect } from 'react'
import { Database, PenSquare, BarChart3, Puzzle, Settings } from 'lucide-react'
import { useUiStore, type ActivityPanel } from '@/stores/ui'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { Stack, Spacer, Tooltip, IconButton, cn } from '@/primitives'
import { NotificationBell } from './NotificationBell'

const topItems: { id: ActivityPanel; icon: typeof Database; label: string }[] = [
  { id: 'explorer', icon: Database, label: 'Explorer' },
  { id: 'query', icon: PenSquare, label: 'Saved Queries' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions' }
]

export function ActivityBar() {
  const { activePanel, sidebarVisible, setActivePanel } = useUiStore()
  const activityBarContributions = usePluginUIStore(selectContributions('activityBar'))

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('activityBar')
  }, [])

  const renderButton = (id: ActivityPanel, Icon: typeof Database, label: string) => {
    const isActive = activePanel === id && sidebarVisible
    return (
      <Tooltip key={id} content={label} side="right">
        <IconButton
          label={label}
          size="lg"
          variant="ghost"
          onClick={() => setActivePanel(id)}
          className={cn(
            'rounded-lg transition-colors',
            isActive
              ? 'bg-accent/10 text-accent hover:bg-accent/10'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          <Icon size={20} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Stack
      align="center"
      gap="xs"
      className="w-12 bg-bg-primary border-r border-border shrink-0 pt-2"
    >
      {topItems.map(({ id, icon, label }) => renderButton(id, icon, label))}
      {activityBarContributions
        .filter((c) => c.meta.zone === 'top' || !c.meta.zone)
        .map((c) => renderButton(
          `plugin:${c.contributionId}` as ActivityPanel,
          Puzzle,
          c.meta.title as string
        ))}
      <Spacer />
      <NotificationBell />
      {renderButton('settings', Settings, 'Settings')}
    </Stack>
  )
}
