import { useEffect, useState } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

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
    <div className="h-6 bg-accent flex items-center px-3 text-xs text-white shrink-0 justify-between">
      <div className="flex items-center gap-3">
        <span>{dbLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Plugin status */}
        <div className="flex items-center gap-1.5 opacity-80">
          {pluginStatus.loading ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              <span>Loading plugins...</span>
            </>
          ) : pluginStatus.failed > 0 ? (
            <>
              <AlertTriangle size={10} />
              <span>{pluginStatus.active}/{pluginStatus.total} plugins ({pluginStatus.failed} failed)</span>
            </>
          ) : pluginStatus.total > 0 ? (
            <>
              <CheckCircle size={10} />
              <span>{pluginStatus.active} plugins</span>
            </>
          ) : null}
        </div>
        <span>UTF-8</span>
      </div>
    </div>
  )
}
