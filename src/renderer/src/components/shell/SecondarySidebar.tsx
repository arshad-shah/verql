import { useEffect } from 'react'
import { Flex, Box, Text } from '@/primitives'
import { useUiStore } from '@/stores/ui'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { InspectorPanel } from '@/components/inspector/InspectorPanel'
import { PluginPanelMount } from '@/components/plugins/PluginPanelMount'
import { NotificationsSidebar } from './NotificationsSidebar'

export function SecondarySidebar() {
  const active = useUiStore(s => s.secondaryActivePanel)
  const contributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)

  useEffect(() => { fetchContributions('panels') }, [fetchContributions])

  if (active === 'notifications') {
    return (
      <Flex direction="column" className="h-full bg-bg-secondary border-l border-border overflow-hidden">
        <PanelHeader title="Notifications" />
        <Box className="flex-1 overflow-auto">
          <NotificationsSidebar />
        </Box>
      </Flex>
    )
  }

  if (active === 'inspector') {
    return (
      <Flex direction="column" className="h-full bg-bg-secondary border-l border-border overflow-hidden">
        <PanelHeader title="Inspector" />
        <Box className="flex-1 overflow-auto">
          <InspectorPanel />
        </Box>
      </Flex>
    )
  }

  if (active.startsWith('plugin:')) {
    const contributionId = active.slice('plugin:'.length)
    const contribution = contributions.find(c => c.contributionId === contributionId)
    const hostWidget = contribution?.widgets.find(w => w.type === 'host-component') as { type: 'host-component'; componentId: string } | undefined
    const componentId = hostWidget?.componentId ?? contributionId
    return (
      <Flex direction="column" className="h-full bg-bg-secondary border-l border-border overflow-hidden">
        <PanelHeader title={(contribution?.meta?.title as string) ?? contributionId} />
        <Box className="flex-1 overflow-hidden">
          <PluginPanelMount surface="panels" componentId={componentId} />
        </Box>
      </Flex>
    )
  }

  return (
    <Flex align="center" justify="center" className="h-full bg-bg-secondary border-l border-border">
      <Text color="muted" size="sm">No panel selected</Text>
    </Flex>
  )
}

function PanelHeader({ title }: { title: string }) {
  return (
    <Flex align="center" className="h-8 px-3 border-b border-border shrink-0">
      <Text size="xs" weight="semibold" className="uppercase tracking-wider">{title}</Text>
    </Flex>
  )
}
