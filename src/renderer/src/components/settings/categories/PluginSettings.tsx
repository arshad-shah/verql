import { useState, useEffect } from 'react'
import { Stack, Flex, Divider, Heading, Text } from '@/primitives'
import { Switch } from '@/primitives'
import { Spinner } from '@/primitives'
import { usePluginUIStore } from '@/stores/plugin-ui'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string }
  contributions: string[]
}

export function PluginSettings() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.invoke('plugins:list').then((list) => {
      setPlugins(list)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (name: string, active: boolean) => {
    if (active) {
      await window.electronAPI.invoke('plugins:activate', name)
    } else {
      await window.electronAPI.invoke('plugins:deactivate', name)
    }
    // Force immediate UI cleanup/refresh
    const uiStore = usePluginUIStore.getState()
    uiStore.invalidateAll()
    await Promise.all([
      uiStore.fetchContributions('statusBar'),
      uiStore.fetchContributions('activityBar'),
      uiStore.fetchContributions('panels'),
      uiStore.fetchContributions('contextMenu'),
    ])
    const list = await window.electronAPI.invoke('plugins:list')
    setPlugins(list)
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-12">
        <Spinner />
      </Flex>
    )
  }

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Plugins</Heading>
        <Text size="xs" color="muted" className="mt-1">Manage installed extensions</Text>
      </div>

      {plugins.map((plugin) => (
        <div key={plugin.name}>
          <Flex direction="row" align="start" justify="between" className="py-2">
            <div className="flex-1 min-w-0 mr-4">
              <Flex direction="row" align="center" gap="sm">
                <Text size="sm" weight="semibold">{plugin.displayName}</Text>
                <Text size="xs" color="muted">v{plugin.version}</Text>
                {plugin.bundled && (
                  <Text size="xs" color="accent" className="bg-accent/10 px-1.5 py-0.5 rounded">Bundled</Text>
                )}
              </Flex>
              <Text size="xs" color="secondary" className="mt-0.5">{plugin.description}</Text>
              {plugin.status.error && (
                <Text size="xs" color="error" className="mt-1">{plugin.status.error}</Text>
              )}
            </div>
            <Switch
              label={`Toggle ${plugin.displayName}`}
              checked={plugin.status.state === 'active' || plugin.status.state === 'degraded'}
              onChange={(e) => handleToggle(plugin.name, e.target.checked)}
            />
          </Flex>
          <Divider />
        </div>
      ))}
    </Stack>
  )
}
