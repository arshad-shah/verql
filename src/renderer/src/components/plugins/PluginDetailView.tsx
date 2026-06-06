import { useEffect, useState } from 'react'
import { Power, PowerOff, Trash2, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import { PluginIcon } from './PluginsPanel'
import { useToastStore } from '@/stores/toast'
import { usePluginUIStore } from '@/stores/plugin-ui'
import { useTranslation } from '@/i18n/I18nProvider'
import type { MessageKey } from '@shared/i18n'
import { Stack, ScrollArea, Flex, Text, Button, Badge, Box, Card, Code, Tabs, EmptyState, Alert, Input, Switch, PasswordInput, NumberInput, Select } from '@/primitives'
import { SettingRow } from '@/components/settings/SettingRow'
import { IPC_CHANNELS } from '@shared/ipc'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  icon?: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
  requestedPermissions: string[]
  grantedPermissions: string[]
}

interface PermissionState {
  trusted: boolean
  declared: string[]
  granted: string[]
  info: Record<string, { title: string; description: string; enforced: boolean; sensitive: boolean }>
}

interface ErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

interface SettingSchema {
  key: string
  title: string
  type: string
  default?: string | number | boolean
  description?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
}

interface Props {
  pluginName: string
}

const STATE_CONFIG: Record<string, { labelKey: MessageKey; variant: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle }> = {
  active: { labelKey: 'plugins.detail.state.active', variant: 'success', icon: CheckCircle },
  degraded: { labelKey: 'plugins.detail.state.degraded', variant: 'warning', icon: AlertTriangle },
  error: { labelKey: 'plugins.detail.state.error', variant: 'error', icon: XCircle },
  inactive: { labelKey: 'plugins.detail.state.inactive', variant: 'default', icon: PowerOff },
  discovered: { labelKey: 'plugins.detail.state.discovered', variant: 'default', icon: Clock },
  validated: { labelKey: 'plugins.detail.state.validated', variant: 'default', icon: Clock },
  resolved: { labelKey: 'plugins.detail.state.resolved', variant: 'default', icon: Clock },
  activating: { labelKey: 'plugins.detail.state.activating', variant: 'default', icon: Clock },
}

const CONTRIBUTION_BADGE_VARIANTS: Record<string, 'accent' | 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  driver: 'accent',
  command: 'info',
  panel: 'success',
  exporter: 'warning',
  importer: 'warning',
  theme: 'default',
  middleware: 'default',
  setting: 'default',
}

const DETAIL_TAB_IDS = ['overview', 'permissions', 'contributions', 'errors', 'settings'] as const

export function PluginDetailView({ pluginName }: Props) {
  const { t } = useTranslation()
  const [plugin, setPlugin] = useState<PluginInfo | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [errors, setErrors] = useState<ErrorRecord[]>([])
  const [expandedError, setExpandedError] = useState<number | null>(null)
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false)
  const [settingsSchema, setSettingsSchema] = useState<SettingSchema[]>([])
  const [settingsValues, setSettingsValues] = useState<Record<string, unknown>>({})
  const [permissions, setPermissions] = useState<PermissionState | null>(null)
  const addToast = useToastStore(s => s.addToast)

  const loadPlugin = async () => {
    const list: PluginInfo[] = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)
    const found = list.find(p => p.name === pluginName)
    if (found) setPlugin(found)
  }

  useEffect(() => { loadPlugin() }, [pluginName])

  useEffect(() => {
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_ERRORS, pluginName)
      .then(setErrors)
      .catch(() => {})
  }, [pluginName])

  useEffect(() => {
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_GET_SETTINGS, pluginName)
      .then(({ schema, values }: { schema: SettingSchema[]; values: Record<string, unknown> }) => {
        setSettingsSchema(schema)
        setSettingsValues(values)
      })
      .catch(() => {})
  }, [pluginName])

  useEffect(() => {
    window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_GET_PERMISSIONS, pluginName)
      .then((state: PermissionState | null) => setPermissions(state))
      .catch(() => {})
  }, [pluginName])

  const handleTogglePermission = async (permission: string, granted: boolean) => {
    if (!permissions) return
    const next = granted
      ? [...new Set([...permissions.granted, permission])]
      : permissions.granted.filter(p => p !== permission)
    const result = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_SET_PERMISSIONS, pluginName, next)
    setPermissions({ ...permissions, granted: result.granted })
    if (isActive) {
      addToast({
        type: 'info',
        title: t('plugins.detail.toast.reEnableTitle'),
        message: t('plugins.detail.toast.reEnableMessage'),
      })
    }
  }

  const handleActivate = async () => {
    const result = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_ACTIVATE, pluginName)
    if (!result.success) addToast({ type: 'error', title: t('plugins.detail.toast.activateFailed'), message: result.error })
    // Force immediate UI refresh
    const uiStore = usePluginUIStore.getState()
    uiStore.invalidateAll()
    await Promise.all([
      uiStore.fetchContributions('statusBar'),
      uiStore.fetchContributions('activityBar'),
      uiStore.fetchContributions('panels'),
      uiStore.fetchContributions('contextMenu'),
    ])
    await loadPlugin()
  }

  const handleDeactivate = async () => {
    await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_DEACTIVATE, pluginName)
    // Force immediate UI cleanup — don't wait for debounced event
    const uiStore = usePluginUIStore.getState()
    uiStore.invalidateAll()
    await Promise.all([
      uiStore.fetchContributions('statusBar'),
      uiStore.fetchContributions('activityBar'),
      uiStore.fetchContributions('panels'),
      uiStore.fetchContributions('contextMenu'),
    ])
    await loadPlugin()
  }

  const handleUninstall = async () => {
    setShowUninstallConfirm(false)
    await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_UNINSTALL, pluginName)
  }

  const handleSettingChange = async (key: string, value: unknown) => {
    setSettingsValues(prev => ({ ...prev, [key]: value }))
    await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_SET_SETTING, pluginName, key, value)
  }

  if (!plugin) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text color="muted">{t('plugins.detail.loading')}</Text>
      </Flex>
    )
  }

  const stateConfig = STATE_CONFIG[plugin.status.state] ?? STATE_CONFIG.inactive
  const isActive = plugin.status.state === 'active' || plugin.status.state === 'degraded'

  return (
    <Flex direction="column" className="h-full bg-bg-primary">
      {/* Compact Header */}
      <Box className="px-6 py-5 border-b border-border-default shrink-0">
        <Flex direction="row" align="center" gap="md">
          <PluginIcon plugin={plugin} size={48} />
          <Box className="flex-1 min-w-0">
            <Flex direction="row" align="center" gap="sm" className="flex-wrap">
              <Text size="lg" weight="semibold" color="primary">{plugin.displayName}</Text>
              <Text size="xs" color="muted">{t('plugins.detail.version', { version: plugin.version })}</Text>
              <Badge size="sm" variant={stateConfig.variant}>{t(stateConfig.labelKey)}</Badge>
              {plugin.bundled && <Badge size="sm">{t('plugins.detail.builtIn')}</Badge>}
            </Flex>
            <Text size="sm" color="secondary" as="p" className="mt-1 leading-relaxed">{plugin.description}</Text>
          </Box>
          <Flex direction="row" gap="sm" className="shrink-0">
            {isActive ? (
              <Button variant="outline" size="sm" onClick={handleDeactivate} className="flex items-center gap-1.5">
                <PowerOff size={14} /> {t('plugins.detail.disable')}
              </Button>
            ) : (
              <Button variant="solid" size="sm" onClick={handleActivate} className="flex items-center gap-1.5">
                <Power size={14} /> {t('plugins.detail.enable')}
              </Button>
            )}
            {!plugin.bundled && (
              <Button variant="outline" size="sm" onClick={() => setShowUninstallConfirm(true)} className="flex items-center gap-1.5 hover:text-error hover:border-error/30">
                <Trash2 size={14} /> {t('plugins.detail.uninstall')}
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Sub-Tabs */}
      <Tabs
        tabs={DETAIL_TAB_IDS.map((id) => ({ id, label: t(`plugins.detail.tabs.${id}`) }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="px-6 shrink-0"
      />

      {/* Tab Content */}
      <ScrollArea direction="vertical" className="flex-1">
        <Box className="px-6 py-5">
          {activeTab === 'overview' && (
            <OverviewTab plugin={plugin} stateConfig={stateConfig} errors={errors} />
          )}
          {activeTab === 'permissions' && (
            <PermissionsTab permissions={permissions} onToggle={handleTogglePermission} />
          )}
          {activeTab === 'contributions' && (
            <ContributionsTab contributions={plugin.contributions} />
          )}
          {activeTab === 'errors' && (
            <ErrorsTab errors={errors} expandedError={expandedError} onToggleError={setExpandedError} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab schema={settingsSchema} values={settingsValues} onChange={handleSettingChange} />
          )}
        </Box>
      </ScrollArea>

      <ConfirmDialog
        open={showUninstallConfirm}
        title={t('plugins.detail.uninstallConfirm.title', { name: plugin.displayName })}
        message={t('plugins.detail.uninstallConfirm.message')}
        confirmLabel={t('plugins.detail.uninstallConfirm.confirm')}
        variant="danger"
        onConfirm={handleUninstall}
        onCancel={() => setShowUninstallConfirm(false)}
      />
    </Flex>
  )
}

function OverviewTab({ plugin, stateConfig, errors }: {
  plugin: PluginInfo
  stateConfig: { labelKey: MessageKey; variant: string; icon: typeof CheckCircle }
  errors: ErrorRecord[]
}) {
  const { t } = useTranslation()
  const StateIcon = stateConfig.icon
  return (
    <Stack gap="lg">
      {/* Stat Cards */}
      <Flex direction="row" gap="md">
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.statusLabel')}</Text>
          <Flex direction="row" align="center" gap="xs">
            <StateIcon size={16} />
            <Text size="sm" weight="medium">{t(stateConfig.labelKey)}</Text>
          </Flex>
        </Card>
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.contributionsLabel')}</Text>
          <Text size="sm" weight="medium">{t('plugins.detail.overview.contributionsValue', { count: plugin.contributions.length })}</Text>
        </Card>
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{t('plugins.detail.overview.errorsLabel')}</Text>
          <Text size="sm" weight="medium">{errors.length > 0 ? t('plugins.detail.overview.errorsValue', { count: errors.length }) : t('plugins.detail.overview.errorsNone')}</Text>
        </Card>
      </Flex>

      {/* Error alert if present */}
      {plugin.status.error && (
        <Alert variant="error">{plugin.status.error}</Alert>
      )}

      {/* Details Card */}
      <Card padding="md">
        <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-3 block">{t('plugins.detail.overview.detailsLabel')}</Text>
        <Stack gap="sm">
          <DetailRow label={t('plugins.detail.overview.identifier')} value={plugin.name} mono />
          <DetailRow label={t('plugins.detail.overview.version')} value={plugin.version} />
          <DetailRow label={t('plugins.detail.overview.source')} value={plugin.bundled ? t('plugins.detail.overview.sourceBuiltIn') : t('plugins.detail.overview.sourceUserInstalled')} />
          {plugin.status.phase && plugin.status.state === 'error' && (
            <DetailRow label={t('plugins.detail.overview.failedDuring')} value={plugin.status.phase} />
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

function ContributionsTab({ contributions }: { contributions: string[] }) {
  const { t } = useTranslation()
  if (contributions.length === 0) {
    return <EmptyState title={t('plugins.detail.contributions.emptyTitle')} description={t('plugins.detail.contributions.emptyDescription')} className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {contributions.map((c, i) => {
          const [type, name] = c.includes(':') ? c.split(':') : ['feature', c]
          const variant = CONTRIBUTION_BADGE_VARIANTS[type] ?? 'default'
          return (
            <Flex key={i} direction="row" align="center" gap="sm" className="py-1">
              <Badge size="sm" variant={variant} className="w-20 text-center justify-center shrink-0">{type}</Badge>
              <Text size="sm" color="secondary">{name}</Text>
            </Flex>
          )
        })}
      </Stack>
    </Card>
  )
}

function PermissionsTab({ permissions, onToggle }: {
  permissions: PermissionState | null
  onToggle: (permission: string, granted: boolean) => void
}) {
  const { t } = useTranslation()
  if (!permissions) {
    return <EmptyState title={t('plugins.detail.permissions.loadingTitle')} description={t('plugins.detail.permissions.loadingDescription')} className="py-12" />
  }

  if (permissions.trusted) {
    return (
      <Stack gap="md">
        <Alert variant="info">
          {t('plugins.detail.permissions.trusted')}
        </Alert>
      </Stack>
    )
  }

  if (permissions.declared.length === 0) {
    return (
      <EmptyState
        title={t('plugins.detail.permissions.noneTitle')}
        description={t('plugins.detail.permissions.noneDescription')}
        className="py-12"
      />
    )
  }

  return (
    <Stack gap="md">
      <Alert variant="warning">
        {t('plugins.detail.permissions.warning')}
      </Alert>
      <Card padding="md">
        <Stack gap="md">
          {permissions.declared.map((perm) => {
            const info = permissions.info[perm]
            const granted = permissions.granted.includes(perm)
            return (
              <Flex key={perm} direction="row" align="start" justify="between" gap="md">
                <Box className="flex-1 min-w-0">
                  <Flex direction="row" align="center" gap="sm" className="flex-wrap">
                    <Text size="sm" weight="medium" color="primary">{info?.title ?? perm}</Text>
                    <Badge size="sm" variant={info?.enforced ? 'accent' : 'default'}>
                      {info?.enforced ? t('plugins.detail.permissions.enforced') : t('plugins.detail.permissions.advisory')}
                    </Badge>
                  </Flex>
                  <Text size="xs" color="muted" as="p" className="mt-1 leading-relaxed">
                    {info?.description ?? t('plugins.detail.permissions.capabilityFallback', { perm })}
                    {info && !info.enforced && (
                      <>{t('plugins.detail.permissions.advisoryNote')}</>
                    )}
                  </Text>
                </Box>
                <Box className="shrink-0">
                  <Switch
                    label={info?.title ?? perm}
                    checked={granted}
                    onChange={(e) => onToggle(perm, e.target.checked)}
                  />
                </Box>
              </Flex>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}

function ErrorsTab({ errors, expandedError, onToggleError }: {
  errors: ErrorRecord[]
  expandedError: number | null
  onToggleError: (i: number | null) => void
}) {
  if (errors.length === 0) {
    return <EmptyState title="No errors" description="No errors have been recorded for this plugin" className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {errors.slice(-20).reverse().map((err, i) => (
          <Box key={i}>
            <Flex
              direction="row"
              align="start"
              gap="sm"
              onClick={() => onToggleError(expandedError === i ? null : i)}
              className="py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
            >
              <XCircle size={14} className="text-error mt-0.5 shrink-0" />
              <Box className="flex-1 min-w-0">
                <Text size="xs" color="secondary" truncate className="block">{err.error}</Text>
                <Text size="xs" color="muted" className="text-[10px]">{new Date(err.timestamp).toLocaleString()}</Text>
              </Box>
            </Flex>
            {expandedError === i && err.stack && (
              <Code block className="text-[11px] text-text-muted bg-bg-tertiary rounded p-3 mt-1 overflow-x-auto whitespace-pre-wrap">
                {err.stack}
              </Code>
            )}
          </Box>
        ))}
      </Stack>
    </Card>
  )
}

function SettingsTab({ schema, values, onChange }: {
  schema: SettingSchema[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  if (schema.length === 0) {
    return <EmptyState title="No settings" description="This plugin has no configurable settings" className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {schema.map((setting) => (
          <SettingRow
            key={setting.key}
            label={setting.title}
            description={setting.description ?? ''}
          >
            <PluginSettingControl
              setting={setting}
              value={values[setting.key]}
              onChange={(v) => onChange(setting.key, v)}
            />
          </SettingRow>
        ))}
      </Stack>
    </Card>
  )
}

function PluginSettingControl({
  setting,
  value,
  onChange
}: {
  setting: SettingSchema
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (setting.type) {
    case 'boolean':
      return (
        <Switch
          label={setting.title}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      )
    case 'password':
      return (
        <PasswordInput
          size="sm"
          className="w-64"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'number':
      return (
        <NumberInput
          size="sm"
          className="w-28"
          value={Number(value ?? setting.default ?? 0)}
          min={setting.min}
          max={setting.max}
          step={setting.step ?? 1}
          onChange={(v) => onChange(v)}
        />
      )
    case 'select':
      return (
        <Select
          size="sm"
          className="w-48"
          value={String(value ?? setting.default ?? '')}
          options={setting.options ?? []}
          onChange={(v) => onChange(v)}
        />
      )
    default:
      return (
        <Input
          size="sm"
          className="w-64"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Flex direction="row" align="center" justify="between">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="xs" color="secondary" className={mono ? 'font-mono' : ''}>{value}</Text>
    </Flex>
  )
}
