import { useEffect, useState } from 'react'
import { Database, PenSquare, BarChart3, Puzzle, Settings, Sparkles, Radio } from 'lucide-react'
import { useUiStore, type ActivityPanel } from '@/stores/ui'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { useAIStore } from '@/stores/ai'
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
  const toggleAIPanel = useAIStore(s => s.togglePanel)
  const aiPanelOpen = useAIStore(s => s.panelOpen)
  const [mcpRunning, setMcpRunning] = useState(false)
  const [mcpClients, setMcpClients] = useState(0)

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('activityBar')
  }, [])

  // Poll MCP server status
  useEffect(() => {
    const checkMcp = async () => {
      try {
        const status = await window.electronAPI.invoke('mcp:status') as { running: boolean; clients: number }
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
      <Spacer />
      <Tooltip content="AI Assistant" side="right">
        <IconButton
          label="AI Assistant"
          size="lg"
          variant="ghost"
          onClick={toggleAIPanel}
          className={cn(
            'rounded-lg transition-colors',
            aiPanelOpen
              ? 'bg-accent/10 text-accent hover:bg-accent/10'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          <Sparkles size={20} />
        </IconButton>
      </Tooltip>
      {mcpRunning && (
        <Tooltip content={`MCP Server · ${mcpClients} client${mcpClients !== 1 ? 's' : ''}`} side="right">
          <IconButton
            label="MCP Server"
            size="lg"
            variant="ghost"
            onClick={() => setActivePanel('settings')}
            className="rounded-lg transition-colors text-green-400 hover:text-green-300 hover:bg-white/5"
          >
            <Radio size={18} />
          </IconButton>
        </Tooltip>
      )}
      <NotificationBell />
      {renderButton('settings', Settings, 'Settings')}
    </Stack>
  )
}
