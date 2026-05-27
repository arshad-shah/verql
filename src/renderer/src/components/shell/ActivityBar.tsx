import { useEffect, useState } from 'react'
import { Database, PenSquare, BarChart3, Puzzle, Settings, Radio } from 'lucide-react'
import { useUiStore, type ActivityPanel } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { Stack, Spacer, Tooltip, IconButton, cn } from '@/primitives'
import { PluginSlot } from '@/components/plugins/PluginSlot'
import { IPC_CHANNELS } from '@shared/ipc'
import type { MCPServerStatus } from '@shared/mcp'

const topItems: { id: ActivityPanel; icon: typeof Database; label: string }[] = [
  { id: 'explorer', icon: Database, label: 'Explorer' },
  { id: 'query', icon: PenSquare, label: 'Saved Queries' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'plugins', icon: Puzzle, label: 'Plugins' }
]

export function ActivityBar() {
  const { activePanel, sidebarVisible, setActivePanel } = useUiStore()
  const openSettings = useTabsStore((s) => s.openSettings)
  const activeTabType = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.type)
  const activityBarContributions = usePluginUIStore(selectContributions('activityBar'))
  const [mcpRunning, setMcpRunning] = useState(false)
  const [mcpClients, setMcpClients] = useState(0)

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('activityBar')
  }, [])

  // Poll MCP server status
  useEffect(() => {
    const checkMcp = async () => {
      try {
        const status = await window.electronAPI.invoke(IPC_CHANNELS.MCP_STATUS) as MCPServerStatus
        setMcpRunning(status.running)
        setMcpClients(status.clients)
      } catch { /* */ }
    }
    checkMcp()
    const interval = setInterval(checkMcp, 10000)
    return () => clearInterval(interval)
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
      <PluginSlot id="app.activityBar.top" />
      <Spacer />
      <PluginSlot id="app.activityBar.bottom" />
      {mcpRunning && (
        <Tooltip content={`MCP Server · ${mcpClients} client${mcpClients !== 1 ? 's' : ''}`} side="right">
          <IconButton
            label="MCP Server"
            size="lg"
            variant="ghost"
            onClick={openSettings}
            className="rounded-lg transition-colors text-green-400 hover:text-green-300 hover:bg-white/5"
          >
            <Radio size={18} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip content="Settings" side="right">
        <IconButton
          label="Settings"
          size="lg"
          variant="ghost"
          onClick={openSettings}
          className={cn(
            'rounded-lg transition-colors',
            activeTabType === 'settings'
              ? 'bg-accent/10 text-accent hover:bg-accent/10'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          <Settings size={20} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
