import { useEffect, useState } from 'react'
import { Power, PowerOff, Trash2, FolderOpen, RefreshCw, Loader2, Package } from 'lucide-react'
import { PluginDetailView } from './PluginDetailView'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

export function ExtensionsPanel() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null)

  const loadPlugins = async () => {
    setLoading(true)
    const list = await window.electronAPI.invoke('plugins:list')
    setPlugins(list)
    setLoading(false)
  }

  useEffect(() => { loadPlugins() }, [])

  const handleActivate = async (name: string) => {
    const result = await window.electronAPI.invoke('plugins:activate', name)
    if (!result.success) alert(`Failed to activate: ${result.error}`)
    await loadPlugins()
  }

  const handleDeactivate = async (name: string) => {
    await window.electronAPI.invoke('plugins:deactivate', name)
    await loadPlugins()
  }

  const handleUninstall = async (name: string) => {
    if (!confirm(`Uninstall "${name}"?`)) return
    await window.electronAPI.invoke('plugins:uninstall', name)
    setSelectedPlugin(null)
    await loadPlugins()
  }

  const handleInstallFromFolder = async () => {
    const path = prompt('Enter path to plugin directory:')
    if (!path) return
    const result = await window.electronAPI.invoke('plugins:install-from-path', path)
    if (result.success) {
      await loadPlugins()
    } else {
      alert(`Install failed: ${result.error}`)
    }
  }

  // Detail view
  const activePlugin = plugins.find(p => p.name === selectedPlugin)
  if (activePlugin) {
    return (
      <PluginDetailView
        plugin={activePlugin}
        onBack={() => setSelectedPlugin(null)}
        onRefresh={loadPlugins}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={16} className="animate-spin text-text-muted" />
      </div>
    )
  }

  const bundledPlugins = plugins.filter(p => p.bundled)
  const installedPlugins = plugins.filter(p => !p.bundled)

  const renderPlugin = (plugin: PluginInfo) => (
    <div key={plugin.name}
      onClick={() => setSelectedPlugin(plugin.name)}
      className="group px-2 py-2 rounded-md hover:bg-white/5 transition-colors mb-0.5 cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          plugin.status.state === 'active' ? 'bg-green-400' :
          plugin.status.state === 'degraded' ? 'bg-yellow-400' :
          plugin.status.state === 'error' ? 'bg-red-400' : 'bg-gray-500'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-primary truncate">{plugin.displayName}</span>
            <span className="text-[10px] text-text-muted">v{plugin.version}</span>
            {plugin.bundled && (
              <span className="text-[9px] text-text-muted bg-white/5 px-1 rounded">built-in</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted truncate mt-0.5">{plugin.description}</p>
          {plugin.contributions.length > 0 && (
            <p className="text-[10px] text-text-muted mt-0.5">{plugin.contributions.join(', ')}</p>
          )}
          {plugin.status.error && (
            <p className="text-[10px] text-error mt-0.5 truncate">{plugin.status.error}</p>
          )}
        </div>
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          {plugin.status.state === 'active' || plugin.status.state === 'degraded' ? (
            <button onClick={() => handleDeactivate(plugin.name)} className="p-1 text-text-muted hover:text-warning rounded" title="Disable">
              <PowerOff size={12} />
            </button>
          ) : (
            <button onClick={() => handleActivate(plugin.name)} className="p-1 text-text-muted hover:text-success rounded" title="Enable">
              <Power size={12} />
            </button>
          )}
          {!plugin.bundled && (
            <button onClick={() => handleUninstall(plugin.name)} className="p-1 text-text-muted hover:text-error rounded" title="Uninstall">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1 flex gap-1">
        <button
          onClick={handleInstallFromFolder}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-colors"
        >
          <FolderOpen size={12} /> Install
        </button>
        <button
          onClick={loadPlugins}
          className="p-1 text-text-muted hover:text-text-primary transition-colors ml-auto"
          title="Refresh"
        >
          <RefreshCw size={11} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {plugins.length === 0 && (
          <div className="text-center py-8">
            <Package size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">No plugins</p>
          </div>
        )}

        {bundledPlugins.length > 0 && (
          <>
            <div className="px-2 pt-2 pb-1">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Built-in</span>
            </div>
            {bundledPlugins.map(renderPlugin)}
          </>
        )}

        {installedPlugins.length > 0 && (
          <>
            <div className="px-2 pt-3 pb-1">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Installed</span>
            </div>
            {installedPlugins.map(renderPlugin)}
          </>
        )}
      </div>
    </div>
  )
}
