import { useEffect, useState } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { Database, AlertTriangle, CheckCircle, Zap, GitBranch } from 'lucide-react'
import { Flex, Text, Spinner, Badge, Tooltip, Box } from '@/primitives'

interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

const DB_LABELS: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
  redis: 'Redis',
}

const isDev = import.meta.env.DEV

export function StatusBar() {
  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const { tabs, activeTabId } = useTabsStore()
  const active = connections.find(c => c.id === activeConnectionId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [pluginStatus, setPluginStatus] = useState<PluginStatus>({ total: 0, active: 0, failed: 0, loading: true })

  useEffect(() => {
    const check = async () => {
      try {
        const list = await window.electronAPI.invoke('plugins:list')
        const activating = list.some((p: { status: { state: string } }) =>
          p.status.state === 'activating' || p.status.state === 'discovered' || p.status.state === 'validated' || p.status.state === 'resolved'
        )
        setPluginStatus({
          total: list.length,
          active: list.filter((p: { status: { state: string } }) => p.status.state === 'active' || p.status.state === 'degraded').length,
          failed: list.filter((p: { status: { state: string } }) => p.status.state === 'error').length,
          loading: activating
        })
      } catch {
        setPluginStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  const dbTypeLabel = active ? (DB_LABELS[active.type] ?? active.type) : null
  const connectionCount = connectedIds.size

  return (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0 select-none"
    >
      {/* Left zone */}
      <Flex align="center" gap="md">
        {/* Connection indicator */}
        <Tooltip content={isConnected ? `Connected to ${active?.name}` : 'No active connection'}>
          <Flex align="center" gap="xs">
            <Box
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-white' : 'bg-white/40'}`}
            />
            {active ? (
              <Flex align="center" gap="xs">
                <Database size={10} />
                <Text size="xs" className="text-white">{dbTypeLabel}</Text>
                <Text size="xs" className="text-white/60">·</Text>
                <Text size="xs" className="text-white">{active.name}</Text>
                <Text size="xs" className="text-white/60">·</Text>
                <Text size="xs" className="text-white/80">{active.database}</Text>
              </Flex>
            ) : (
              <Text size="xs" className="text-white/60">Disconnected</Text>
            )}
          </Flex>
        </Tooltip>

        {/* Connection count */}
        {connectionCount > 1 && (
          <Tooltip content={`${connectionCount} active connections`}>
            <Flex align="center" gap="xs" className="opacity-70">
              <Zap size={9} />
              <Text size="xs" className="text-white">{connectionCount}</Text>
            </Flex>
          </Tooltip>
        )}

        {/* Active tab schema info */}
        {activeTab?.type === 'query' && (activeTab as { schema?: string }).schema && (
          <>
            <Text size="xs" className="text-white/40">|</Text>
            <Tooltip content="Active schema">
              <Flex align="center" gap="xs" className="opacity-70">
                <GitBranch size={9} />
                <Text size="xs" className="text-white">{(activeTab as { schema?: string }).schema}</Text>
              </Flex>
            </Tooltip>
          </>
        )}
      </Flex>

      {/* Right zone */}
      <Flex align="center" gap="md">
        {/* Plugin status */}
        <Flex align="center" gap="xs" className="opacity-80">
          {pluginStatus.loading ? (
            <>
              <Spinner size="xs" label="Loading plugins" className="text-white" />
              <Text size="xs" className="text-white">Loading plugins...</Text>
            </>
          ) : pluginStatus.failed > 0 ? (
            <Tooltip content={`${pluginStatus.failed} plugin(s) failed to load`}>
              <Flex align="center" gap="xs">
                <AlertTriangle size={10} />
                <Badge variant="warning" size="sm">
                  {pluginStatus.active}/{pluginStatus.total} plugins
                </Badge>
              </Flex>
            </Tooltip>
          ) : pluginStatus.total > 0 ? (
            <Tooltip content={`${pluginStatus.active} plugin(s) active`}>
              <Flex align="center" gap="xs">
                <CheckCircle size={10} />
                <Badge variant="success" size="sm">
                  {pluginStatus.active} plugins
                </Badge>
              </Flex>
            </Tooltip>
          ) : null}
        </Flex>

        {/* Tab count */}
        <Tooltip content={`${tabs.length} tab(s) open`}>
          <Text size="xs" className="text-white/60">{tabs.length} tabs</Text>
        </Tooltip>

        {/* Encoding */}
        <Text size="xs" className="text-white/60">UTF-8</Text>

        {/* Dev indicator */}
        {isDev && (
          <Badge variant="warning" size="sm" className="text-[9px] leading-none">DEV</Badge>
        )}
      </Flex>
    </Flex>
  )
}
