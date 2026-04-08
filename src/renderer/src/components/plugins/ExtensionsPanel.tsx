import { useEffect, useState } from 'react'
import { Power, PowerOff, Trash2, FolderOpen, RefreshCw, Package } from 'lucide-react'
import { PluginDetailView } from './PluginDetailView'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import { useToastStore } from '@/stores/toast'
import { Stack, ScrollArea, Flex, Text, EmptyState, IconButton, Button, Badge, Spinner, Box, Modal, Input, Alert } from '@/primitives'

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
  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null)
  const [showInstallPath, setShowInstallPath] = useState(false)
  const [installPath, setInstallPath] = useState('')
  const addToast = useToastStore(s => s.addToast)

  const loadPlugins = async () => {
    setLoading(true)
    const list = await window.electronAPI.invoke('plugins:list')
    setPlugins(list)
    setLoading(false)
  }

  useEffect(() => { loadPlugins() }, [])

  const handleActivate = async (name: string) => {
    const result = await window.electronAPI.invoke('plugins:activate', name)
    if (!result.success) addToast({ type: 'error', title: 'Failed to activate', message: result.error })
    await loadPlugins()
  }

  const handleDeactivate = async (name: string) => {
    await window.electronAPI.invoke('plugins:deactivate', name)
    await loadPlugins()
  }

  const handleUninstall = async (name: string) => {
    await window.electronAPI.invoke('plugins:uninstall', name)
    setSelectedPlugin(null)
    setUninstallTarget(null)
    await loadPlugins()
  }

  const handleInstallFromFolder = async () => {
    if (!installPath.trim()) return
    const result = await window.electronAPI.invoke('plugins:install-from-path', installPath.trim())
    if (result.success) {
      setShowInstallPath(false)
      setInstallPath('')
      await loadPlugins()
    } else {
      addToast({ type: 'error', title: 'Install failed', message: result.error })
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
    <Box key={plugin.name}
      onClick={() => setSelectedPlugin(plugin.name)}
      className="group px-2 py-2 rounded-md hover:bg-white/5 transition-colors mb-0.5 cursor-pointer"
    >
      <Flex direction="row" align="start" gap="sm">
        <Box className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColor(plugin.status.state)}`} />
        <Box className="flex-1 min-w-0">
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
        </Box>
        <Flex className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
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
              onClick={() => setUninstallTarget(plugin.name)}
              className="text-text-muted hover:text-error"
            >
              <Trash2 size={12} />
            </IconButton>
          )}
        </Flex>
      </Flex>
    </Box>
  )

  return (
    <Stack className="h-full">
      <Flex direction="row" align="center" className="px-2 py-1 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInstallPath(true)}
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
            <Box className="px-2 pt-2 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Built-in</Text>
            </Box>
            {bundledPlugins.map(renderPlugin)}
          </>
        )}

        {installedPlugins.length > 0 && (
          <>
            <Box className="px-2 pt-3 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Installed</Text>
            </Box>
            {installedPlugins.map(renderPlugin)}
          </>
        )}
      </ScrollArea>

      <ConfirmDialog
        open={uninstallTarget !== null}
        title={`Uninstall "${uninstallTarget}"?`}
        message="This plugin will be permanently removed."
        confirmLabel="Uninstall"
        variant="danger"
        onConfirm={() => { if (uninstallTarget) handleUninstall(uninstallTarget) }}
        onCancel={() => setUninstallTarget(null)}
      />

      <Modal open={showInstallPath} onClose={() => { setShowInstallPath(false); setInstallPath('') }} className="w-[420px] max-w-[90vw]">
        <Stack gap="md" className="p-4">
          <Text size="sm" weight="semibold">Install Plugin from Directory</Text>
          <Input
            value={installPath}
            onChange={e => setInstallPath(e.target.value)}
            placeholder="/path/to/plugin"
            size="sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleInstallFromFolder() }}
          />
        </Stack>
        <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => { setShowInstallPath(false); setInstallPath('') }}>Cancel</Button>
          <Button variant="solid" size="sm" onClick={handleInstallFromFolder} disabled={!installPath.trim()}>Install</Button>
        </Flex>
      </Modal>
    </Stack>
  )
}
