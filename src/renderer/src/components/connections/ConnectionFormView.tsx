import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import {
  ScrollArea, Container, Stack, Flex, Box, Grid, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput, FileContentInput, FilePathInput,
  Button, Spinner
} from '@/primitives'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  tabId: string
  editingId?: string
}

interface PluginField {
  key: string; label: string; type: string; required?: boolean
  default?: string | number | boolean; group?: string; fetchable?: boolean; step?: number
  options?: { value: string; label: string }[]
  /** Comma-separated extension filter for `file` / `file-path` fields (e.g. `.db,.sqlite`). */
  accept?: string
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

/** A titled card that groups related fields together. */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Box className="border border-border-subtle rounded-lg bg-bg-secondary overflow-hidden">
      <Box className="px-4 py-3 border-b border-border-subtle flex flex-col">
        <Text size="sm" weight="semibold" color="primary">{title}</Text>
        {description && <Text size="xs" color="muted" className="mt-0.5">{description}</Text>}
      </Box>
      <Box className="p-4">{children}</Box>
    </Box>
  )
}

export function ConnectionFormView({ tabId, editingId }: Props) {
  const { t } = useTranslation()
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
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_CONNECTION_FIELDS).then(setPluginDrivers).catch(() => { })
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_MIDDLEWARE_FIELDS).then(setMiddlewareFields).catch(() => { })
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

  // Static (non-fetchable, non-grouped) driver fields, split for layout.
  const staticFields = activePluginDriver?.connectionFields.filter(f => !f.group && !f.fetchable) ?? []
  const staticInputs = staticFields.filter(f => f.type !== 'boolean')
  const staticToggles = staticFields.filter(f => f.type === 'boolean')

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
        IPC_CHANNELS.DB_CONNECTION_OPTIONS,
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await saveConnection(profile as unknown as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  /** A compact toggle row: label on the left, switch on the right. */
  const renderToggle = (key: string, label: string, checked: boolean, onChange: (checked: boolean) => void) => (
    <Flex key={key} direction="row" align="center" justify="between" gap="md" className="min-h-8">
      <Text size="sm" color="secondary">{label}</Text>
      <Switch label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Flex>
  )

  // Wide fields read better spanning the full width of the 2-column grid.
  const fieldSpan = (field: PluginField) =>
    field.type === 'select' || field.type === 'file' || field.type === 'file-path' || field.type === 'password' ? 'col-span-2' : ''

  const renderPluginField = (field: PluginField, className?: string) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.fetchable && field.type === 'select') {
      const options = fetchableOptions[field.key]
      const isAuthenticated = authStatus === 'authenticated' && options !== undefined

      if (isAuthenticated && options.length > 0) {
        return (
          <FormField key={field.key} label={field.label} className={className}>
            <Select
              size="lg"
              searchable
              searchPlaceholder={t('connections.form.searchPlaceholder', { label: field.label.toLowerCase() })}
              value={String(value)}
              onChange={(v) => update({ [field.key]: v })}
              options={options.map(o => ({ value: o, label: o }))}
            />
          </FormField>
        )
      }

      return (
        <FormField key={field.key} label={field.label} className={className}>
          <Input
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            placeholder={authStatus === 'authenticated' ? t('connections.form.typeAValue') : t('connections.form.authenticateFirst')}
            disabled={authStatus !== 'authenticated'}
            size="lg"
          />
        </FormField>
      )
    }

    if (!field.fetchable && field.type === 'select' && field.options) {
      return (
        <FormField key={field.key} label={field.label} className={className}>
          <Select
            size="lg"
            value={String(value)}
            onChange={(v) => update({ [field.key]: v })}
            options={field.options}
          />
        </FormField>
      )
    }

    if (field.type === 'password') {
      return (
        <FormField key={field.key} label={field.label} className={className}>
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
        <FormField key={field.key} label={field.label} className={className}>
          <NumberInput
            value={Number(value) || 0}
            onChange={(v) => update({ [field.key]: v })}
            size="lg"
          />
        </FormField>
      )
    }

    // A `file-path` field stores the chosen file's native path (e.g. the SQLite
    // database file or a private-key file the adapter reads itself). A plain
    // `file` field reads and stores the file's *contents* (e.g. an inline SSH key).
    if (field.type === 'file-path') {
      return (
        <FormField key={field.key} label={field.label} className={className}>
          <FilePathInput
            value={String(value)}
            onChange={(filePath) => update({ [field.key]: filePath })}
            accept={field.accept}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'file') {
      return (
        <FormField key={field.key} label={field.label} className={className}>
          <FileContentInput
            value={String(value)}
            onChange={(content) => update({ [field.key]: content })}
            accept={field.accept ?? '.pem,.key'}
            size="lg"
          />
        </FormField>
      )
    }

    return (
      <FormField key={field.key} label={field.label} className={className}>
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

    const stepLabel = stepIndex === 0
      ? t('connections.wizard.stepSelectRoleWarehouse')
      : t('connections.wizard.stepSelectDatabaseSchema')

    return (
      <Box
        key={step}
        className={`border rounded-lg transition-colors ${isCompleted ? 'border-success/20 bg-success/5' :
            isActive ? 'border-accent/30' :
              'border-border-subtle opacity-60'
          }`}
      >
        <Flex direction="row" align="center" gap="sm" className="px-4 py-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${isCompleted ? 'bg-bg-success text-text-on-solid' :
              isActive ? 'bg-bg-accent text-text-on-solid' :
                'bg-bg-tertiary text-text-muted'
            }`}>
            {isCompleted ? <Check size={14} /> : stepIndex + 2}
          </div>
          <Text size="sm" weight="semibold" color={isPending ? 'muted' : 'primary'}>
            {t('connections.wizard.stepLabel', { n: stepIndex + 2, label: stepLabel })}
          </Text>
        </Flex>
        {(isActive || isCompleted) && (
          <Stack gap="md" className="px-4 pb-4">
            <Grid columns={2} gap="md">
              {stepFields.map(f => renderPluginField(f, fieldSpan(f)))}
            </Grid>
            {isActive && !isCompleted && (
              <div>
                <Button
                  type="button"
                  variant="solid"
                  size="sm"
                  onClick={() => handleStepComplete(step)}
                >
                  {t('connections.wizard.continue')}
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
          <Stack gap="lg">
            {/* Header */}
            <Stack gap="xs">
              <Heading level={2}>{editingId ? t('connections.form.editTitle') : t('connections.form.newTitle')}</Heading>
            </Stack>

            {/* General — identity */}
            <Section title={t('connections.form.general')} description={t('connections.form.generalDescription')}>
              <Stack gap="md">
                <FormField label={t('connections.form.databaseType')}>
                  <Select
                    size="lg"
                    value={String(profile.type)}
                    onChange={(v) => handleTypeChange(v as DatabaseType)}
                    options={allTypes}
                  />
                </FormField>
                <Grid columns={2} gap="md">
                  <FormField label={t('connections.form.connectionName')}>
                    <Input
                      required
                      value={String(profile.name ?? '')}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder={t('connections.form.connectionNamePlaceholder')}
                      size="lg"
                    />
                  </FormField>
                  <FormField label={t('connections.form.color')}>
                    <ColorInput
                      value={String(profile.color ?? '#7c6ff7')}
                      onChange={(v) => update({ color: v })}
                      presets={COLOR_PRESETS}
                      size="lg"
                    />
                  </FormField>
                </Grid>
                <Divider />
                {renderToggle(
                  'defaultAutoCommit',
                  t('connections.form.autoCommit'),
                  profile.defaultAutoCommit !== false,
                  (checked) => update({ defaultAutoCommit: checked })
                )}
              </Stack>
            </Section>

            {/* Connection — driver fields */}
            {activePluginDriver && staticFields.length > 0 && (
              <Section title={t('connections.form.connection')} description={t('connections.form.connectionDescription')}>
                <Stack gap="md">
                  {staticInputs.length > 0 && (
                    <Grid columns={2} gap="md">
                      {staticInputs.map(f => renderPluginField(f, fieldSpan(f)))}
                    </Grid>
                  )}
                  {staticToggles.length > 0 && (
                    <>
                      <Divider />
                      <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">
                        {t('connections.form.options')}
                      </Text>
                      <Stack gap="xs">
                        {staticToggles.map(f =>
                          renderToggle(
                            f.key,
                            f.label,
                            !!profile[f.key],
                            (checked) => update({ [f.key]: checked })
                          )
                        )}
                      </Stack>
                    </>
                  )}
                </Stack>
              </Section>
            )}

            {/* Step-based auth wizard for fetchable fields */}
            {hasFetchableFields && (
              <Stack gap="md">
                {/* Step 1: Authenticate */}
                <Box className={`border rounded-lg transition-colors ${authStatus === 'authenticated' ? 'border-success/20 bg-success/5' :
                    authStatus === 'authenticating' ? 'border-accent/30' :
                      'border-border-subtle'
                  }`}>
                  <Flex direction="row" align="center" gap="sm" className="px-4 py-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${authStatus === 'authenticated' ? 'bg-bg-success text-text-on-solid' :
                        authStatus === 'authenticating' ? 'bg-bg-accent text-text-on-solid' :
                          'bg-bg-tertiary text-text-muted'
                      }`}>
                      {authStatus === 'authenticated' ? <Check size={14} /> : '1'}
                    </div>
                    <Text size="sm" weight="semibold">
                      {t('connections.wizard.stepAuthenticate')}
                    </Text>
                  </Flex>
                  <Stack gap="sm" className="px-4 pb-4">
                    {authStatus === 'authenticated' ? (
                      <Flex direction="row" align="center" gap="md">
                        <Text size="sm" color="success">{t('connections.wizard.authenticatedSuccess')}</Text>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAuthenticate}>
                          {t('connections.wizard.reAuthenticate')}
                        </Button>
                      </Flex>
                    ) : (
                      <>
                        <Text size="sm" color="muted">
                          {t('connections.wizard.authIntro')}
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
                            {authStatus === 'authenticating' ? t('connections.wizard.authenticating') : t('connections.wizard.authenticate')}
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
              <Box className="border border-border-subtle rounded-lg overflow-hidden bg-bg-secondary">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSshExpanded(!sshExpanded)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-none border-0 h-auto justify-start"
                >
                  {sshExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Stack gap="xs" className="items-start text-left">
                    <Text size="sm" weight="semibold" color="primary">{t('connections.form.sshTunnel')}</Text>
                    {!sshExpanded && <Text size="xs" color="muted">{t('connections.form.sshTunnelDescription')}</Text>}
                  </Stack>
                </Button>
                {sshExpanded && (
                  <Box className="px-4 pb-4 border-t border-border-subtle pt-4">
                    <Grid columns={2} gap="md">
                      {sshFields.map(f => renderPluginField(f as PluginField, fieldSpan(f as PluginField)))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}

            <Divider />

            {/* Footer actions */}
            <Flex direction="row" align="start" justify="between" gap="md">
              <ConnectionTestButton profile={profile as unknown as ConnectionProfile} />
              <Flex direction="row" gap="sm">
                <Button type="button" variant="outline" size="lg" onClick={handleCancel}>{t('common.cancel')}</Button>
                <Button type="submit" variant="solid" size="lg">
                  {editingId ? t('connections.form.saveChanges') : t('connections.form.addConnection')}
                </Button>
              </Flex>
            </Flex>
          </Stack>
        </form>
      </Container>
    </ScrollArea>
  )
}
