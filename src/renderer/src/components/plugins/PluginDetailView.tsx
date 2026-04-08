import { useEffect, useState } from 'react'
import { ArrowLeft, Power, PowerOff, Trash2, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

interface ErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

interface Props {
  plugin: PluginInfo
  onBack: () => void
  onRefresh: () => void
}

const STATE_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-green-400', icon: CheckCircle },
  degraded: { label: 'Degraded', color: 'text-yellow-400', icon: AlertTriangle },
  error: { label: 'Error', color: 'text-red-400', icon: XCircle },
  inactive: { label: 'Disabled', color: 'text-gray-400', icon: PowerOff },
  discovered: { label: 'Discovered', color: 'text-gray-400', icon: Clock },
  validated: { label: 'Validated', color: 'text-gray-400', icon: Clock },
  resolved: { label: 'Ready', color: 'text-gray-400', icon: Clock },
  activating: { label: 'Loading...', color: 'text-blue-400', icon: Clock }
}

export function PluginDetailView({ plugin, onBack, onRefresh }: Props) {
  const [errors, setErrors] = useState<ErrorRecord[]>([])
  const [expandedError, setExpandedError] = useState<number | null>(null)

  useEffect(() => {
    window.electronAPI.invoke('plugins:errors', plugin.name)
      .then(setErrors)
      .catch(() => {})
  }, [plugin.name])

  const handleActivate = async () => {
    const result = await window.electronAPI.invoke('plugins:activate', plugin.name)
    if (!result.success) alert(`Failed to activate: ${result.error}`)
    onRefresh()
  }

  const handleDeactivate = async () => {
    await window.electronAPI.invoke('plugins:deactivate', plugin.name)
    onRefresh()
  }

  const handleUninstall = async () => {
    if (!confirm(`Uninstall "${plugin.displayName}"?`)) return
    await window.electronAPI.invoke('plugins:uninstall', plugin.name)
    onBack()
    onRefresh()
  }

  const stateConfig = STATE_CONFIG[plugin.status.state] ?? STATE_CONFIG.inactive
  const StateIcon = stateConfig.icon
  const isActive = plugin.status.state === 'active' || plugin.status.state === 'degraded'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors">
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs text-text-muted">Extension Details</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Plugin Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-accent">{plugin.displayName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary">{plugin.displayName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-text-muted">v{plugin.version}</span>
                {plugin.bundled && (
                  <span className="text-[9px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded">built-in</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">{plugin.description}</p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {isActive ? (
              <button onClick={handleDeactivate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:text-warning hover:border-warning/30 transition-colors">
                <PowerOff size={12} /> Disable
              </button>
            ) : (
              <button onClick={handleActivate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
                <Power size={12} /> Enable
              </button>
            )}
            {!plugin.bundled && (
              <button onClick={handleUninstall}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-error hover:border-error/30 transition-colors">
                <Trash2 size={12} /> Uninstall
              </button>
            )}
          </div>
        </div>

        {/* Status Section */}
        <Section title="Status">
          <div className="flex items-center gap-2">
            <StateIcon size={14} className={stateConfig.color} />
            <span className={`text-xs font-medium ${stateConfig.color}`}>{stateConfig.label}</span>
          </div>
          {plugin.status.phase && plugin.status.state === 'error' && (
            <p className="text-[10px] text-text-muted mt-1">Failed during: {plugin.status.phase}</p>
          )}
          {plugin.status.error && (
            <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded-md">
              <p className="text-[10px] text-red-400">{plugin.status.error}</p>
            </div>
          )}
        </Section>

        {/* Contributions Section */}
        {plugin.contributions.length > 0 && (
          <Section title="Contributions">
            <div className="space-y-1">
              {plugin.contributions.map((c, i) => {
                const [type, name] = c.includes(':') ? c.split(':') : ['feature', c]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wide text-text-muted bg-white/5 px-1.5 py-0.5 rounded w-16 text-center shrink-0">
                      {type}
                    </span>
                    <span className="text-xs text-text-secondary">{name}</span>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Error Log Section */}
        {errors.length > 0 && (
          <Section title={`Error Log (${errors.length})`}>
            <div className="space-y-1">
              {errors.slice(-10).reverse().map((err, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedError(expandedError === i ? null : i)}
                    className="w-full text-left flex items-start gap-2 py-1 hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
                  >
                    <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-text-secondary truncate">{err.error}</p>
                      <p className="text-[9px] text-text-muted">{new Date(err.timestamp).toLocaleString()}</p>
                    </div>
                  </button>
                  {expandedError === i && err.stack && (
                    <pre className="text-[9px] text-text-muted bg-black/20 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                      {err.stack}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Identifier */}
        <Section title="Info">
          <div className="space-y-1.5">
            <InfoRow label="Identifier" value={plugin.name} />
            <InfoRow label="Version" value={plugin.version} />
            <InfoRow label="Source" value={plugin.bundled ? 'Built-in' : 'User installed'} />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-border">
      <h4 className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className="text-[10px] text-text-secondary font-mono">{value}</span>
    </div>
  )
}
