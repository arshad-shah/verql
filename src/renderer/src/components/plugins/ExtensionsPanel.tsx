import { useEffect, useState } from 'react'
import { Puzzle, Power, PowerOff, Trash2, FolderOpen, RefreshCw, Loader2 } from 'lucide-react'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  active: boolean
  error?: string
}

export function ExtensionsPanel() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)

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
    await loadPlugins()
  }

  const handleInstallFromFolder = async () => {
    // Prompt user for folder path — in a real app this would use a dialog
    const path = prompt('Enter path to plugin directory:')
    if (!path) return
    const result = await window.electronAPI.invoke('plugins:install-from-path', path)
    if (result.success) {
      await loadPlugins()
    } else {
      alert(`Install failed: ${result.error}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={16} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1 flex gap-1">
        <button
          onClick={handleInstallFromFolder}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded transition-colors"
        >
          <FolderOpen size={12} /> Install from folder
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
            <Puzzle size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">No plugins installed</p>
            <p className="text-text-muted text-[10px] mt-1">
              Install plugins from a local directory
            </p>
          </div>
        )}

        {plugins.map(plugin => (
          <div key={plugin.name} className="group px-2 py-2 rounded-md hover:bg-white/5 transition-colors mb-0.5">
            <div className="flex items-start gap-2">
              <Puzzle size={14} className={plugin.active ? 'text-accent mt-0.5' : 'text-text-muted mt-0.5'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary truncate">{plugin.displayName}</span>
                  <span className="text-[10px] text-text-muted">v{plugin.version}</span>
                </div>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{plugin.description}</p>
                {plugin.error && (
                  <p className="text-[10px] text-error mt-0.5">{plugin.error}</p>
                )}
              </div>
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                {plugin.active ? (
                  <button
                    onClick={() => handleDeactivate(plugin.name)}
                    className="p-1 text-text-muted hover:text-warning rounded"
                    title="Deactivate"
                  >
                    <PowerOff size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(plugin.name)}
                    className="p-1 text-text-muted hover:text-success rounded"
                    title="Activate"
                  >
                    <Power size={12} />
                  </button>
                )}
                <button
                  onClick={() => handleUninstall(plugin.name)}
                  className="p-1 text-text-muted hover:text-error rounded"
                  title="Uninstall"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
