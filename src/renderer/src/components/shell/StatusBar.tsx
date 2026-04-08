import { useEffect, useState } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Flex, Text, Spinner, Badge } from '@/primitives'

interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

export function StatusBar() {
  const { activeConnectionId, connections } = useConnectionsStore()
  const active = connections.find(c => c.id === activeConnectionId)
  const [pluginStatus, setPluginStatus] = useState<PluginStatus>({ total: 0, active: 0, failed: 0, loading: true })

  useEffect(() => {
    // Initial load + poll for boot completion
    const check = async () => {
      try {
        const list = await window.electronAPI.invoke('plugins:list')
        const activating = list.some(p => p.status.state === 'activating' || p.status.state === 'discovered' || p.status.state === 'validated' || p.status.state === 'resolved')
        setPluginStatus({
          total: list.length,
          active: list.filter(p => p.status.state === 'active' || p.status.state === 'degraded').length,
          failed: list.filter(p => p.status.state === 'error').length,
          loading: activating
        })
      } catch {
        setPluginStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    // Poll briefly during startup to catch boot completion
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  const dbLabel = active
    ? `${active.type === 'postgresql' ? 'PostgreSQL' : active.type === 'mysql' ? 'MySQL' : active.type === 'sqlite' ? 'SQLite' : active.type} · ${active.name} · ${active.database}`
    : 'Disconnected'

  return (
    <Flex
      align="center"
      justify="between"
      className="h-6 bg-accent px-3 text-white shrink-0"
    >
      <Flex align="center" gap="md">
        <Text size="xs" className="text-white">{dbLabel}</Text>
      </Flex>
      <Flex align="center" gap="md">
        {/* Plugin status */}
        <Flex align="center" gap="xs" className="opacity-80">
          {pluginStatus.loading ? (
            <>
              <Spinner size="xs" label="Loading plugins" className="text-white" />
              <Text size="xs" className="text-white">Loading plugins...</Text>
            </>
          ) : pluginStatus.failed > 0 ? (
            <>
              <AlertTriangle size={10} />
              <Badge variant="warning" size="sm">
                {pluginStatus.active}/{pluginStatus.total} plugins ({pluginStatus.failed} failed)
              </Badge>
            </>
          ) : pluginStatus.total > 0 ? (
            <>
              <CheckCircle size={10} />
              <Badge variant="success" size="sm">
                {pluginStatus.active} plugins
              </Badge>
            </>
          ) : null}
        </Flex>
        <Text size="xs" className="text-white">UTF-8</Text>
      </Flex>
    </Flex>
  )
}
