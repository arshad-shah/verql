import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
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

interface PluginField {
  key: string; label: string; type: string; required?: boolean
  default?: string | number | boolean; group?: string; fetchable?: boolean; step?: number
  options?: { value: string; label: string }[]
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: PluginField[]
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
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

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

  // Derive step structure from plugin fields
  const fetchableFields = activePluginDriver?.connectionFields.filter(f => f.fetchable) ?? []
  const hasFetchableFields = fetchableFields.length > 0
  const steps = [...new Set(fetchableFields.map(f => f.step ?? 1))].sort((a, b) => a - b)
  const currentStep = steps.find(s => !completedSteps.has(s)) ?? (steps.length > 0 ? Math.max(...steps) + 1 : 0)

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
    setCompletedSteps(new Set())
  }

  const handleAuthenticate = async () => {
    if (!activePluginDriver) return
    setAuthStatus('authenticating')
    setAuthError('')
    try {
      // Fetch ALL fetchable fields in one connection (single browser auth)
      const fieldKeys = fetchableFields.map(f => f.key)
      const options = await window.electronAPI.invoke(
        'db:connection-options',
        profile as unknown as ConnectionProfile,
        fieldKeys
      )
      setFetchableOptions(options)
      setAuthStatus('authenticated')
    } catch (err) {
      setAuthStatus('error')
      setAuthError((err as Error).message)
    }
  }

  const handleStepComplete = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]))
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await saveConnection(profile as unknown as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  const renderPluginField = (field: PluginField) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.fetchable && field.type === 'select') {
      const options = fetchableOptions[field.key]
      const isAuthenticated = authStatus === 'authenticated' && options !== undefined

      if (isAuthenticated && options.length > 0) {
        return (
          <FormField key={field.key} label={field.label}>
            <Select
              size="lg"
              searchable
              searchPlaceholder={`Search ${field.label.toLowerCase()}…`}
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

    if (!field.fetchable && field.type === 'select' && field.options) {
      return (
        <FormField key={field.key} label={field.label}>
          <Select
            size="lg"
            value={String(value)}
            onChange={(v) => update({ [field.key]: v })}
            options={field.options}
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

  const renderStepSection = (step: number, stepFields: PluginField[]) => {
    const stepIndex = steps.indexOf(step)
    const isCompleted = completedSteps.has(step)
    const isActive = step === currentStep && authStatus === 'authenticated'
    const isPending = !isCompleted && !isActive

    const stepLabel = stepIndex === 0 ? 'Select Role & Warehouse' : 'Select Database & Schema'

    return (
      <Box
        key={step}
        className={`border rounded-lg transition-colors ${
          isCompleted ? 'border-success/20 bg-success/5' :
          isActive ? 'border-accent/30' :
          'border-border-subtle opacity-60'
        }`}
      >
        <Flex direction="row" align="center" gap="sm" className="px-3 py-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
            isCompleted ? 'bg-bg-success text-text-on-solid' :
            isActive ? 'bg-bg-accent text-text-on-solid' :
            'bg-bg-tertiary text-text-muted'
          }`}>
            {isCompleted ? <Check size={14} /> : stepIndex + 2}
          </div>
          <Text size="sm" weight="semibold" color={isPending ? 'muted' : 'primary'}>
            Step {stepIndex + 2}: {stepLabel}
          </Text>
        </Flex>
        {(isActive || isCompleted) && (
          <Stack gap="md" className="px-3 pb-3">
            {stepFields.map(renderPluginField)}
            {isActive && !isCompleted && (
              <div>
                <Button
                  type="button"
                  variant="solid"
                  size="sm"
                  onClick={() => handleStepComplete(step)}
                >
                  Continue
                </Button>
              </div>
            )}
          </Stack>
        )}
      </Box>
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

            {/* Connection fields — non-fetchable, non-grouped */}
            {activePluginDriver && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {activePluginDriver.connectionFields.filter(f => !f.group && !f.fetchable).map(renderPluginField)}
              </Stack>
            )}

            {/* Step-based auth wizard for fetchable fields */}
            {hasFetchableFields && (
              <Stack gap="md">
                {/* Step 1: Authenticate */}
                <Box className={`border rounded-lg transition-colors ${
                  authStatus === 'authenticated' ? 'border-success/20 bg-success/5' :
                  authStatus === 'authenticating' ? 'border-accent/30' :
                  'border-border-subtle'
                }`}>
                  <Flex direction="row" align="center" gap="sm" className="px-3 py-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      authStatus === 'authenticated' ? 'bg-bg-success text-text-on-solid' :
                      authStatus === 'authenticating' ? 'bg-bg-accent text-text-on-solid' :
                      'bg-bg-tertiary text-text-muted'
                    }`}>
                      {authStatus === 'authenticated' ? <Check size={14} /> : '1'}
                    </div>
                    <Text size="sm" weight="semibold">
                      Step 1: Authenticate
                    </Text>
                  </Flex>
                  <Stack gap="sm" className="px-3 pb-3">
                    {authStatus === 'authenticated' ? (
                      <Flex direction="row" align="center" gap="md">
                        <Text size="sm" color="success">Authenticated successfully</Text>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAuthenticate}>
                          Re-authenticate
                        </Button>
                      </Flex>
                    ) : (
                      <>
                        <Text size="sm" color="muted">
                          Connect to your account to load available roles, warehouses, databases, and schemas.
                        </Text>
                        <div>
                          <Button
                            type="button"
                            variant="solid"
                            size="md"
                            onClick={handleAuthenticate}
                            disabled={authStatus === 'authenticating'}
                            className="flex items-center gap-1.5"
                          >
                            {authStatus === 'authenticating' ? <Spinner size="xs" /> : null}
                            {authStatus === 'authenticating' ? 'Authenticating...' : 'Authenticate'}
                          </Button>
                        </div>
                      </>
                    )}
                    {authStatus === 'error' && (
                      <Text size="sm" color="error">{authError}</Text>
                    )}
                  </Stack>
                </Box>

                {/* Subsequent steps — grouped by step number */}
                {steps.map(step => {
                  const stepFields = fetchableFields.filter(f => (f.step ?? 1) === step)
                  return renderStepSection(step, stepFields)
                })}
              </Stack>
            )}

            {/* SSH Tunnel */}
            {sshFields.length > 0 && (
              <Box className="border border-border-subtle rounded-lg overflow-hidden">
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
            <ConnectionTestButton profile={profile as unknown as ConnectionProfile} />
          </Stack>
        </form>
      </Container>
    </ScrollArea>
  )
}
