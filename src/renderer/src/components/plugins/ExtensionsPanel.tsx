import { useEffect, useState } from 'react'
import { Power, PowerOff, Trash2, FolderOpen, RefreshCw, Package } from 'lucide-react'
import { PluginDetailView } from './PluginDetailView'
import { Stack, ScrollArea, Flex, Text, EmptyState, IconButton, Button, Badge, Spinner } from '@/primitives'

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
      <Flex align="center" justify="center" className="py-8">
        <Spinner size="sm" />
      </Flex>
    )
  }

  const bundledPlugins = plugins.filter(p => p.bundled)
  const installedPlugins = plugins.filter(p => !p.bundled)

  const statusColor = (state: string) => {
    if (state === 'active') return 'bg-green-400'
    if (state === 'degraded') return 'bg-yellow-400'
    if (state === 'error') return 'bg-red-400'
    return 'bg-gray-500'
  }

  const renderPlugin = (plugin: PluginInfo) => (
    <div key={plugin.name}
      onClick={() => setSelectedPlugin(plugin.name)}
      className="group px-2 py-2 rounded-md hover:bg-white/5 transition-colors mb-0.5 cursor-pointer"
    >
      <Flex direction="row" align="start" gap="sm">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColor(plugin.status.state)}`} />
        <div className="flex-1 min-w-0">
          <Flex direction="row" align="center" gap="sm">
            <Text size="xs" weight="medium" color="primary" truncate>{plugin.displayName}</Text>
            <Text size="xs" color="muted" className="text-[10px]">v{plugin.version}</Text>
            {plugin.bundled && (
              <Badge size="sm" className="text-[9px]">built-in</Badge>
            )}
          </Flex>
          <Text size="xs" color="muted" truncate className="text-[10px] mt-0.5 block">{plugin.description}</Text>
          {plugin.contributions.length > 0 && (
            <Text size="xs" color="muted" className="text-[10px] mt-0.5 block">{plugin.contributions.join(', ')}</Text>
          )}
          {plugin.status.error && (
            <Text size="xs" color="error" truncate className="text-[10px] mt-0.5 block">{plugin.status.error}</Text>
          )}
        </div>
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          {plugin.status.state === 'active' || plugin.status.state === 'degraded' ? (
            <IconButton
              label="Disable"
              size="xs"
              variant="ghost"
              onClick={() => handleDeactivate(plugin.name)}
              className="text-text-muted hover:text-warning"
            >
              <PowerOff size={12} />
            </IconButton>
          ) : (
            <IconButton
              label="Enable"
              size="xs"
              variant="ghost"
              onClick={() => handleActivate(plugin.name)}
              className="text-text-muted hover:text-success"
            >
              <Power size={12} />
            </IconButton>
          )}
          {!plugin.bundled && (
            <IconButton
              label="Uninstall"
              size="xs"
              variant="ghost"
              onClick={() => handleUninstall(plugin.name)}
              className="text-text-muted hover:text-error"
            >
              <Trash2 size={12} />
            </IconButton>
          )}
        </div>
      </Flex>
    </div>
  )

  return (
    <Stack className="h-full">
      <Flex direction="row" align="center" className="px-2 py-1 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInstallFromFolder}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
        >
          <FolderOpen size={12} /> Install
        </Button>
        <IconButton
          label="Refresh"
          size="xs"
          variant="ghost"
          onClick={loadPlugins}
          className="ml-auto text-text-muted hover:text-text-primary"
        >
          <RefreshCw size={11} />
        </IconButton>
      </Flex>

      <ScrollArea direction="vertical" className="flex-1 px-1">
        {plugins.length === 0 && (
          <EmptyState
            icon={<Package size={24} className="text-text-muted" />}
            title="No plugins"
            className="py-8"
          />
        )}

        {bundledPlugins.length > 0 && (
          <>
            <div className="px-2 pt-2 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Built-in</Text>
            </div>
            {bundledPlugins.map(renderPlugin)}
          </>
        )}

        {installedPlugins.length > 0 && (
          <>
            <div className="px-2 pt-3 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Installed</Text>
            </div>
            {installedPlugins.map(renderPlugin)}
          </>
        )}
      </ScrollArea>
    </Stack>
  )
}
