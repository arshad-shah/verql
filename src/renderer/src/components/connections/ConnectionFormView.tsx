import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import {
  ScrollArea, Container, Stack, Flex, Box, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput, FileContentInput,
  Button, Spinner
} from '@/primitives'

interface Props {
  tabId: string
  editingId?: string
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string; fetchable?: boolean }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const COLOR_PRESETS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionFormView({ tabId, editingId }: Props) {
  const saveConnection = useConnectionsStore(s => s.saveConnection)
  const connections = useConnectionsStore(s => s.connections)
  const closeTab = useTabsStore(s => s.closeTab)

  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)
  const [fetchableOptions, setFetchableOptions] = useState<Record<string, string[]>>({})
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated' | 'error'>('idle')
  const [authError, setAuthError] = useState('')

  const existingProfile = editingId ? connections.find(c => c.id === editingId) : undefined

  const [profile, setProfile] = useState<Record<string, unknown>>({
    id: crypto.randomUUID(),
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    color: '#7c6ff7',
    ...(existingProfile ?? {})
  })

  useEffect(() => {
    window.electronAPI.invoke('plugins:connection-fields').then(setPluginDrivers).catch(() => {})
    window.electronAPI.invoke('plugins:middleware-fields').then(setMiddlewareFields).catch(() => {})
  }, [])

  const allTypes = pluginDrivers.map(d => ({
    value: d.driverId as DatabaseType,
    label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1)
  }))

  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')
  const hasFetchableFields = activePluginDriver?.connectionFields.some(f => f.fetchable) ?? false

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const driver = pluginDrivers.find(d => d.driverId === type)
    const defaults: Record<string, unknown> = { type }
    if (driver) {
      for (const field of driver.connectionFields) {
        if (field.default !== undefined && profile[field.key] === undefined) {
          defaults[field.key] = field.default
        }
      }
    }
    update(defaults)
    setAuthStatus('idle')
    setFetchableOptions({})
  }

  const handleAuthenticate = async () => {
    if (!activePluginDriver) return
    setAuthStatus('authenticating')
    setAuthError('')
    try {
      const fetchableFields = activePluginDriver.connectionFields.filter(f => f.fetchable)
      const options: Record<string, string[]> = {}
      for (const field of fetchableFields) {
        const result = await window.electronAPI.invoke('db:connection-options', profile as ConnectionProfile, field.key)
        options[field.key] = result
      }
      setFetchableOptions(options)
      setAuthStatus('authenticated')
    } catch (err) {
      setAuthStatus('error')
      setAuthError((err as Error).message)
    }
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await saveConnection(profile as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  const renderPluginField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; fetchable?: boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.fetchable && field.type === 'select') {
      const options = fetchableOptions[field.key]
      const isAuthenticated = authStatus === 'authenticated' && options !== undefined

      if (isAuthenticated && options.length > 0) {
        return (
          <FormField key={field.key} label={field.label}>
            <Select
              size="lg"
              value={String(value)}
              onChange={(v) => update({ [field.key]: v })}
              options={options.map(o => ({ value: o, label: o }))}
            />
          </FormField>
        )
      }

      return (
        <FormField key={field.key} label={field.label}>
          <Input
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            placeholder={authStatus === 'authenticated' ? 'Type a value' : 'Authenticate first'}
            disabled={authStatus !== 'authenticated'}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'boolean') {
      return (
        <Flex key={field.key} direction="row" align="center" gap="md">
          <Switch
            label={field.label}
            checked={!!profile[field.key]}
            onChange={(e) => update({ [field.key]: e.target.checked })}
          />
          <Text size="lg" color="secondary">{field.label}</Text>
        </Flex>
      )
    }

    if (field.type === 'password') {
      return (
        <FormField key={field.key} label={field.label}>
          <PasswordInput
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'number') {
      return (
        <FormField key={field.key} label={field.label}>
          <NumberInput
            value={Number(value) || 0}
            onChange={(v) => update({ [field.key]: v })}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'file') {
      return (
        <FormField key={field.key} label={field.label}>
          <FileContentInput
            value={String(value)}
            onChange={(content) => update({ [field.key]: content })}
            accept=".pem,.key"
            size="lg"
          />
        </FormField>
      )
    }

    return (
      <FormField key={field.key} label={field.label}>
        <Input
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: e.target.value })}
          size="lg"
        />
      </FormField>
    )
  }

  return (
    <ScrollArea direction="vertical" className="h-full bg-bg-primary">
      <Container size="md" className="py-8">
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Header */}
            <Flex direction="row" align="center" justify="between">
              <Heading level={2}>{editingId ? 'Edit Connection' : 'New Connection'}</Heading>
              <Flex direction="row" gap="md">
                <Button type="button" variant="outline" size="md" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="solid" size="md">
                  {editingId ? 'Save Changes' : 'Add Connection'}
                </Button>
              </Flex>
            </Flex>

            <Divider />

            {/* Database Type */}
            <Stack gap="md">
              <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Database Type</Text>
              <FormField label="Database Type">
                <Select
                  size="lg"
                  value={String(profile.type)}
                  onChange={(v) => handleTypeChange(v as DatabaseType)}
                  options={allTypes}
                />
              </FormField>
            </Stack>

            {/* General */}
            <Stack gap="md">
              <Text size="sm" color="muted" weight="semibold" className="uppercase tracking-wider">General</Text>
              <FormField label="Connection Name">
                <Input
                  required
                  value={String(profile.name ?? '')}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="My Database"
                  size="lg"
                />
              </FormField>
              <FormField label="Color">
                <ColorInput
                  value={String(profile.color ?? '#7c6ff7')}
                  onChange={(v) => update({ color: v })}
                  presets={COLOR_PRESETS}
                  size="lg"
                />
              </FormField>
            </Stack>

            {/* Connection fields — all from plugins */}
            {activePluginDriver && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {activePluginDriver.connectionFields.filter(f => !f.group && !f.fetchable).map(renderPluginField)}
              </Stack>
            )}

            {/* Authenticate button for fetchable fields */}
            {hasFetchableFields && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Authenticate to load options</Text>
                <Flex direction="row" align="center" gap="md">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleAuthenticate}
                    disabled={authStatus === 'authenticating'}
                    className="flex items-center gap-1.5"
                  >
                    {authStatus === 'authenticating' ? <Spinner size="xs" /> : null}
                    {authStatus === 'authenticated' ? 'Re-authenticate' : 'Authenticate'}
                  </Button>
                  {authStatus === 'authenticated' && (
                    <Text size="sm" color="success">Authenticated — select options below</Text>
                  )}
                </Flex>
                {authStatus === 'error' && (
                  <Text size="sm" color="error">{authError}</Text>
                )}
              </Stack>
            )}

            {/* Fetchable fields (dropdowns after auth) */}
            {activePluginDriver && activePluginDriver.connectionFields.some(f => f.fetchable) && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Configuration</Text>
                {activePluginDriver.connectionFields.filter(f => f.fetchable).map(renderPluginField)}
              </Stack>
            )}

            {/* SSH Tunnel */}
            {sshFields.length > 0 && (
              <Box className="border border-border-default rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSshExpanded(!sshExpanded)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none border-0 h-auto justify-start"
                >
                  {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Text size="lg" color="secondary">SSH Tunnel</Text>
                </Button>
                {sshExpanded && (
                  <Stack gap="md" className="px-3 pb-3">
                    {sshFields.map(renderPluginField)}
                  </Stack>
                )}
              </Box>
            )}

            {/* Test Connection */}
            <ConnectionTestButton profile={profile as ConnectionProfile} />
          </Stack>
        </form>
      </Container>
    </ScrollArea>
  )
}
