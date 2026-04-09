import { useEffect, useState, useCallback, useRef } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useNotificationsStore } from '@/stores/notifications'
import { Zap, AlertTriangle, ArrowLeftRight, Minus } from 'lucide-react'
import { Flex, Spinner, Text } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import { ConnectionCard } from './ConnectionCard'
import { ConnectionSwitcher } from './ConnectionSwitcher'
import { StatusBarMetric } from './StatusBarMetric'
import type { QueryTab } from '@shared/types'

interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

const isDev = import.meta.env.DEV

export function StatusBar() {
  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const { tabs, activeTabId } = useTabsStore()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const active = connections.find((c) => c.id === activeConnectionId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const queryTab = activeTab?.type === 'query' ? (activeTab as QueryTab) : null

  const [pluginStatus, setPluginStatus] = useState<PluginStatus>({
    total: 0,
    active: 0,
    failed: 0,
    loading: true,
  })
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [showNewConnection, setShowNewConnection] = useState(false)
  const pluginFailNotified = useRef(false)

  // Plugin polling (same logic as before, with notification on failure)
  useEffect(() => {
    const check = async () => {
      try {
        const list = await window.electronAPI.invoke('plugins:list')
        const activating = list.some(
          (p: { status: { state: string } }) =>
            p.status.state === 'activating' ||
            p.status.state === 'discovered' ||
            p.status.state === 'validated' ||
            p.status.state === 'resolved'
        )
        const activeCount = list.filter(
          (p: { status: { state: string } }) =>
            p.status.state === 'active' || p.status.state === 'degraded'
        ).length
        const failedCount = list.filter(
          (p: { status: { state: string } }) => p.status.state === 'error'
        ).length

        setPluginStatus({
          total: list.length,
          active: activeCount,
          failed: failedCount,
          loading: activating,
        })

        // Notify once when plugin failures are detected
        if (failedCount > 0 && !pluginFailNotified.current) {
          pluginFailNotified.current = true
          addNotification({
            type: 'warning',
            message: `${failedCount} plugin(s) failed to load`,
            source: { type: 'plugin', id: 'system', label: 'Plugin system' },
          })
        }
      } catch {
        setPluginStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [addNotification])

  // Close switcher when new-connection form is needed
  const handleNewConnection = useCallback(() => {
    setShowNewConnection(true)
  }, [])

  // Emit event for App.tsx to handle new connection form
  useEffect(() => {
    if (showNewConnection) {
      window.dispatchEvent(new CustomEvent('statusbar:new-connection'))
      setShowNewConnection(false)
    }
  }, [showNewConnection])

  const connectionCount = connectedIds.size

  return (
    <Flex
      align="center"
      className="relative h-9.5 shrink-0 select-none border-t border-border-default bg-bg-primary px-3"
    >
      {/* Left zone */}
      <Flex align="center" gap="xs" className="mr-auto">
        <div className="relative">
          <ConnectionCard
            isConnected={isConnected}
            isError={false}
            dbType={active?.type ?? null}
            dbName={active?.name ?? null}
            schema={queryTab?.schema ?? null}
            isOpen={switcherOpen}
            onClick={() => setSwitcherOpen((prev) => !prev)}
          />
          <ConnectionSwitcher
            isOpen={switcherOpen}
            onClose={() => setSwitcherOpen(false)}
            onNewConnection={handleNewConnection}
          />
        </div>

        {/* Connection count badge */}
        {connectionCount > 1 && (
          <Flex align="center" gap="xs" className="rounded-[5px] border border-accent/15 bg-accent/8 px-1.5 py-0.5">
            <ArrowLeftRight size={10} className="text-accent" />
            <Text size="xs" color="accent" className="text-[10px]">
              {connectionCount}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Center zone — contextual metrics */}
      <Flex align="center" gap="xs">
        {!isConnected ? (
          <Minus size={12} className="text-text-disabled" />
        ) : queryTab?.isExecuting ? (
          <StatusBarMetric color="warning" label="Running..." animated />
        ) : queryTab?.error ? (
          <StatusBarMetric color="error" label="Query failed" icon={<AlertTriangle size={10} />} />
        ) : queryTab?.results ? (
          <>
            <StatusBarMetric
              color="success"
              icon={<Zap size={10} />}
              label={`${queryTab.results.duration}ms`}
            />
            <StatusBarMetric
              color="info"
              label={`${queryTab.results.rowCount} rows`}
            />
          </>
        ) : null}
      </Flex>

      {/* Right zone — tools */}
      <Flex align="center" gap="xs" className="ml-auto">
        {/* Plugin status */}
        <Flex
          align="center"
          gap="xs"
          className="rounded-md border border-border-default bg-bg-tertiary px-2 py-1"
        >
          {pluginStatus.loading ? (
            <>
              <Spinner size="xs" label="Loading plugins" />
              <Text size="xs" color="secondary" className="text-[10px]">
                Loading...
              </Text>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  pluginStatus.failed > 0 ? 'bg-warning' : 'bg-success'
                )}
              />
              <Text size="xs" color="secondary" className="text-[10px]">
                {pluginStatus.failed > 0
                  ? `${pluginStatus.active}/${pluginStatus.total} plugins`
                  : `${pluginStatus.active} plugins`}
              </Text>
            </>
          )}
        </Flex>

        {/* DEV badge */}
        {isDev && (
          <Text as="span" weight="semibold" className="rounded-md bg-accent px-1.5 py-1 text-[9px] text-white">
            DEV
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
