import { useState, useEffect, useCallback } from 'react'
import { Stack, Flex, Divider, Heading, Text, Box, Input, NumberInput, PasswordInput, Select, Switch } from '@/primitives'
import { Spinner } from '@/primitives'
import { usePluginUIStore } from '@/stores/plugin-ui'
import { SettingRow } from '../SettingRow'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string }
  contributions: string[]
}

interface PluginSettingSchema {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'select'
  default?: string | number | boolean
  description?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  category?: string
}

interface PluginSettingsBundle {
  schema: PluginSettingSchema[]
  values: Record<string, unknown>
}

function SettingControl({ schema, value, onChange }: { schema: PluginSettingSchema; value: unknown; onChange: (v: unknown) => void }) {
  switch (schema.type) {
    case 'boolean':
      return <Switch label={schema.title} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
    case 'password':
      return <PasswordInput size="sm" className="w-64" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return <NumberInput size="sm" className="w-28" value={Number(value ?? schema.default ?? 0)} min={schema.min} max={schema.max} step={schema.step ?? 1} onChange={(v) => onChange(v)} />
    case 'select':
      return <Select size="sm" className="w-48" value={String(value ?? schema.default ?? '')} options={schema.options ?? []} onChange={(v) => onChange(v)} />
    default:
      return <Input size="sm" className="w-64" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
  }
}

export function PluginSettings() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [pluginSettings, setPluginSettings] = useState<Record<string, PluginSettingsBundle>>({})

  const loadSettings = useCallback(async (list: PluginInfo[]) => {
    const active = list.filter(p => p.status.state === 'active' || p.status.state === 'degraded')
    const entries = await Promise.all(
      active.map(async (p) => {
        try {
          const bundle = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_GET_SETTINGS, p.name)
          return [p.name, bundle as PluginSettingsBundle] as const
        } catch {
          return [p.name, { schema: [], values: {} }] as const
        }
      })
    )
    setPluginSettings(Object.fromEntries(entries))
  }, [])

  const reload = useCallback(async () => {
    const list = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)
    setPlugins(list)
    await loadSettings(list)
    setLoading(false)
  }, [loadSettings])

  useEffect(() => {
    reload()
    const off = window.electronAPI.on(IPC_EVENTS.PLUGINS_LIFECYCLE, reload)
    return () => off?.()
  }, [reload])

  const updateSetting = async (pluginName: string, key: string, value: unknown) => {
    await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_SET_SETTING, pluginName, key, value)
    setPluginSettings(prev => ({
      ...prev,
      [pluginName]: prev[pluginName]
        ? { ...prev[pluginName], values: { ...prev[pluginName].values, [key]: value } }
        : prev[pluginName]
    }))
  }

  const handleToggle = async (name: string, active: boolean) => {
    if (active) {
      await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_ACTIVATE, name)
    } else {
      await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_DEACTIVATE, name)
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
    const list = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)
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
        <Text size="xs" color="muted" className="mt-1">Manage installed plugins</Text>
      </div>

      {plugins.map((plugin) => {
        const bundle = pluginSettings[plugin.name]
        const ownSettings = (bundle?.schema ?? []).filter(s => !s.category || s.category === 'plugin')
        const isActive = plugin.status.state === 'active' || plugin.status.state === 'degraded'
        return (
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
                checked={isActive}
                onChange={(e) => handleToggle(plugin.name, e.target.checked)}
              />
            </Flex>
            {isActive && ownSettings.length > 0 && (
              <Box className="ml-0 pl-4 border-l border-border/40 mb-3">
                {ownSettings.map((s) => (
                  <SettingRow key={s.key} label={s.title} description={s.description ?? ''}>
                    <SettingControl
                      schema={s}
                      value={bundle?.values[s.key]}
                      onChange={(v) => updateSetting(plugin.name, s.key, v)}
                    />
                  </SettingRow>
                ))}
              </Box>
            )}
            <Divider />
          </div>
        )
      })}
    </Stack>
  )
}
