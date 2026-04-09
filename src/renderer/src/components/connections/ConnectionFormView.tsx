import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import {
  ScrollArea, Container, Stack, Flex, Box, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput,
  Button
} from '@/primitives'

interface Props {
  tabId: string
  editingId?: string
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const BUILTIN_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLOR_PRESETS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionFormView({ tabId, editingId }: Props) {
  const saveConnection = useConnectionsStore(s => s.saveConnection)
  const connections = useConnectionsStore(s => s.connections)
  const closeTab = useTabsStore(s => s.closeTab)

  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)

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

  const allTypes = [
    ...BUILTIN_TYPES.map(t => ({ value: t.value, label: t.label })),
    ...pluginDrivers.map(d => ({ value: d.driverId as DatabaseType, label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1) }))
  ]

  const isBuiltin = BUILTIN_TYPES.some(t => t.value === profile.type)
  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const isSqlite = profile.type === 'sqlite'
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const builtinPort = BUILTIN_TYPES.find(t => t.value === type)?.defaultPort
    if (builtinPort !== undefined) {
      update({ type, port: builtinPort })
    } else {
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveConnection(profile as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  const renderPluginField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.type === 'boolean') {
      return (
        <Flex key={field.key} direction="row" align="center" gap="sm">
          <Switch
            label={field.label}
            checked={!!profile[field.key]}
            onChange={(e) => update({ [field.key]: e.target.checked })}
          />
          <Text size="sm" color="secondary">{field.label}</Text>
        </Flex>
      )
    }

    if (field.type === 'password') {
      return (
        <FormField key={field.key} label={field.label}>
          <PasswordInput
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            size="sm"
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
            size="sm"
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
          size="sm"
        />
      </FormField>
    )
  }

  return (
    <ScrollArea direction="vertical" className="h-full bg-bg-primary">
      <Container size="sm" className="py-8">
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Header */}
            <Flex direction="row" align="center" justify="between">
              <Heading level={2}>{editingId ? 'Edit Connection' : 'New Connection'}</Heading>
              <Flex direction="row" gap="sm">
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="solid" size="sm">
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
                  size="sm"
                  value={String(profile.type)}
                  onChange={(e) => handleTypeChange(e.target.value as DatabaseType)}
                >
                  {allTypes.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormField>
            </Stack>

            {/* General */}
            <Stack gap="md">
              <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">General</Text>
              <FormField label="Connection Name">
                <Input
                  required
                  value={String(profile.name ?? '')}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="My Database"
                  size="sm"
                />
              </FormField>
              <FormField label="Color">
                <ColorInput
                  value={String(profile.color ?? '#7c6ff7')}
                  onChange={(v) => update({ color: v })}
                  presets={COLOR_PRESETS}
                  size="sm"
                />
              </FormField>
            </Stack>

            {/* Connection fields */}
            {isBuiltin ? (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {isSqlite ? (
                  <FormField label="Database File">
                    <Input
                      required
                      value={String(profile.database ?? '')}
                      onChange={(e) => update({ database: e.target.value })}
                      placeholder="/path/to/database.sqlite"
                      size="sm"
                    />
                  </FormField>
                ) : (
                  <>
                    <Flex direction="row" gap="md">
                      <FormField label="Host" className="flex-1">
                        <Input
                          required
                          value={String(profile.host ?? '')}
                          onChange={(e) => update({ host: e.target.value })}
                          placeholder="localhost"
                          size="sm"
                        />
                      </FormField>
                      <FormField label="Port" className="w-28">
                        <NumberInput
                          value={Number(profile.port) || 0}
                          onChange={(v) => update({ port: v })}
                          min={0}
                          max={65535}
                          size="sm"
                        />
                      </FormField>
                    </Flex>
                    <FormField label="Database">
                      <Input
                        required
                        value={String(profile.database ?? '')}
                        onChange={(e) => update({ database: e.target.value })}
                        placeholder="mydb"
                        size="sm"
                      />
                    </FormField>
                  </>
                )}
              </Stack>
            ) : activePluginDriver ? (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {activePluginDriver.connectionFields.filter(f => !f.group).map(renderPluginField)}
              </Stack>
            ) : null}

            {/* Authentication */}
            {isBuiltin && !isSqlite && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Authentication</Text>
                <Flex direction="row" gap="md">
                  <FormField label="Username" className="flex-1">
                    <Input
                      value={String(profile.username ?? '')}
                      onChange={(e) => update({ username: e.target.value })}
                      placeholder="postgres"
                      size="sm"
                    />
                  </FormField>
                  <FormField label="Password" className="flex-1">
                    <PasswordInput
                      value={String(profile.password ?? '')}
                      onChange={(e) => update({ password: e.target.value })}
                      size="sm"
                    />
                  </FormField>
                </Flex>
                <Flex direction="row" align="center" gap="sm">
                  <Switch
                    label="Use SSL"
                    checked={!!profile.ssl}
                    onChange={(e) => update({ ssl: e.target.checked })}
                  />
                  <Text size="sm" color="secondary">Use SSL</Text>
                </Flex>
              </Stack>
            )}

            {/* SSH Tunnel */}
            {sshFields.length > 0 && !isSqlite && (
              <Box className="border border-border-default rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSshExpanded(!sshExpanded)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none border-0 h-auto justify-start"
                >
                  {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Text size="sm" color="secondary">SSH Tunnel</Text>
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
