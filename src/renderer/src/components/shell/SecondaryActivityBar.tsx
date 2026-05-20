import { ListTree } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { Stack, Spacer, Tooltip, IconButton, cn } from '@/primitives'
import { PluginSlot } from '@/components/plugins/PluginSlot'
import { NotificationBell } from './NotificationBell'

export function SecondaryActivityBar() {
  const active = useUiStore(s => s.secondaryActivePanel)
  const visible = useUiStore(s => s.secondarySidebarVisible)
  const setActive = useUiStore(s => s.setSecondaryActivePanel)

  const renderButton = (id: string, Icon: typeof ListTree, label: string) => {
    const isActive = active === id && visible
    return (
      <Tooltip key={id} content={label} side="left">
        <IconButton
          label={label}
          size="lg"
          variant="ghost"
          onClick={() => setActive(id)}
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
      className="w-12 bg-bg-primary border-l border-border shrink-0 pt-2"
    >
      {renderButton('inspector', ListTree, 'Inspector')}
      <NotificationBell />
      <PluginSlot id="app.secondaryActivityBar.top" />
      <Spacer />
      <PluginSlot id="app.secondaryActivityBar.bottom" />
    </Stack>
  )
}
