import { useEffect, useState } from 'react'
import { ArrowLeft, Power, PowerOff, Trash2, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import { useToastStore } from '@/stores/toast'
import { Stack, ScrollArea, Flex, Text, Button, IconButton, Badge, Divider, Box, Code, Alert } from '@/primitives'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

interface ErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

interface Props {
  plugin: PluginInfo
  onBack: () => void
  onRefresh: () => void
}

const STATE_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-green-400', icon: CheckCircle },
  degraded: { label: 'Degraded', color: 'text-yellow-400', icon: AlertTriangle },
  error: { label: 'Error', color: 'text-red-400', icon: XCircle },
  inactive: { label: 'Disabled', color: 'text-gray-400', icon: PowerOff },
  discovered: { label: 'Discovered', color: 'text-gray-400', icon: Clock },
  validated: { label: 'Validated', color: 'text-gray-400', icon: Clock },
  resolved: { label: 'Ready', color: 'text-gray-400', icon: Clock },
  activating: { label: 'Loading...', color: 'text-blue-400', icon: Clock }
}

export function PluginDetailView({ plugin, onBack, onRefresh }: Props) {
  const [errors, setErrors] = useState<ErrorRecord[]>([])
  const [expandedError, setExpandedError] = useState<number | null>(null)
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false)
  const addToast = useToastStore(s => s.addToast)

  useEffect(() => {
    window.electronAPI.invoke('plugins:errors', plugin.name)
      .then(setErrors)
      .catch(() => {})
  }, [plugin.name])

  const handleActivate = async () => {
    const result = await window.electronAPI.invoke('plugins:activate', plugin.name)
    if (!result.success) addToast({ type: 'error', title: 'Failed to activate', message: result.error })
    onRefresh()
  }

  const handleDeactivate = async () => {
    await window.electronAPI.invoke('plugins:deactivate', plugin.name)
    onRefresh()
  }

  const handleUninstall = async () => {
    setShowUninstallConfirm(false)
    await window.electronAPI.invoke('plugins:uninstall', plugin.name)
    onBack()
    onRefresh()
  }

  const stateConfig = STATE_CONFIG[plugin.status.state] ?? STATE_CONFIG.inactive
  const StateIcon = stateConfig.icon
  const isActive = plugin.status.state === 'active' || plugin.status.state === 'degraded'

  return (
    <Stack className="h-full">
      {/* Header */}
      <Flex direction="row" align="center" gap="sm" className="px-3 py-2 border-b border-border">
        <IconButton
          label="Back"
          size="xs"
          variant="ghost"
          onClick={onBack}
          className="text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={14} />
        </IconButton>
        <Text size="xs" color="muted">Extension Details</Text>
      </Flex>

      <ScrollArea direction="vertical" className="flex-1">
        {/* Plugin Header */}
        <Box className="px-4 pt-4 pb-3">
          <Flex direction="row" align="start" gap="md">
            <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-accent/10 shrink-0">
              <Text size="lg" weight="bold" color="accent">{plugin.displayName.charAt(0)}</Text>
            </Flex>
            <Box className="flex-1 min-w-0">
              <Text size="sm" weight="semibold" color="primary" as="h3">{plugin.displayName}</Text>
              <Flex direction="row" align="center" gap="sm" className="mt-0.5">
                <Text size="xs" color="muted" className="text-[10px]">v{plugin.version}</Text>
                {plugin.bundled && (
                  <Badge size="sm" className="text-[9px]">built-in</Badge>
                )}
              </Flex>
            </Box>
          </Flex>
          <Text size="xs" color="secondary" as="p" className="mt-3 leading-relaxed">{plugin.description}</Text>

          {/* Action buttons */}
          <Flex direction="row" gap="sm" className="mt-3">
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                className="flex items-center gap-1.5 hover:text-warning hover:border-warning/30"
              >
                <PowerOff size={12} /> Disable
              </Button>
            ) : (
              <Button
                variant="solid"
                size="sm"
                onClick={handleActivate}
                className="flex items-center gap-1.5"
              >
                <Power size={12} /> Enable
              </Button>
            )}
            {!plugin.bundled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUninstallConfirm(true)}
                className="flex items-center gap-1.5 hover:text-error hover:border-error/30"
              >
                <Trash2 size={12} /> Uninstall
              </Button>
            )}
          </Flex>
        </Box>

        {/* Status Section */}
        <Section title="Status">
          <Flex direction="row" align="center" gap="sm">
            <StateIcon size={14} className={stateConfig.color} />
            <Text size="xs" weight="medium" className={stateConfig.color}>{stateConfig.label}</Text>
          </Flex>
          {plugin.status.phase && plugin.status.state === 'error' && (
            <Text size="xs" color="muted" as="p" className="text-[10px] mt-1">Failed during: {plugin.status.phase}</Text>
          )}
          {plugin.status.error && (
            <Alert variant="error" className="mt-2 text-[10px] py-2 px-3">
              {plugin.status.error}
            </Alert>
          )}
        </Section>

        {/* Contributions Section */}
        {plugin.contributions.length > 0 && (
          <Section title="Contributions">
            <Stack gap="xs">
              {plugin.contributions.map((c, i) => {
                const [type, name] = c.includes(':') ? c.split(':') : ['feature', c]
                return (
                  <Flex key={i} direction="row" align="center" gap="sm">
                    <Badge size="sm" className="text-[9px] w-16 text-center shrink-0">{type}</Badge>
                    <Text size="xs" color="secondary">{name}</Text>
                  </Flex>
                )
              })}
            </Stack>
          </Section>
        )}

        {/* Error Log Section */}
        {errors.length > 0 && (
          <Section title={`Error Log (${errors.length})`}>
            <Stack gap="xs">
              {errors.slice(-10).reverse().map((err, i) => (
                <Box key={i}>
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedError(expandedError === i ? null : i)}
                    className="w-full text-left flex items-start gap-2 py-1 hover:bg-white/5 rounded px-1 -mx-1 transition-colors h-auto border-0"
                  >
                    <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />
                    <Box className="flex-1 min-w-0">
                      <Text size="xs" color="secondary" truncate className="text-[10px] block">{err.error}</Text>
                      <Text size="xs" color="muted" className="text-[9px]">{new Date(err.timestamp).toLocaleString()}</Text>
                    </Box>
                  </Button>
                  {expandedError === i && err.stack && (
                    <Code block className="text-[9px] text-text-muted bg-black/20 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                      {err.stack}
                    </Code>
                  )}
                </Box>
              ))}
            </Stack>
          </Section>
        )}

        {/* Identifier */}
        <Section title="Info">
          <Stack gap="xs">
            <InfoRow label="Identifier" value={plugin.name} />
            <InfoRow label="Version" value={plugin.version} />
            <InfoRow label="Source" value={plugin.bundled ? 'Built-in' : 'User installed'} />
          </Stack>
        </Section>
      </ScrollArea>

      <ConfirmDialog
        open={showUninstallConfirm}
        title={`Uninstall "${plugin.displayName}"?`}
        message="This plugin will be permanently removed."
        confirmLabel="Uninstall"
        variant="danger"
        onConfirm={handleUninstall}
        onCancel={() => setShowUninstallConfirm(false)}
      />
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box className="px-4 py-3 border-t border-border">
      <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">{title}</Text>
      {children}
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex direction="row" align="center" justify="between">
      <Text size="xs" color="muted" className="text-[10px]">{label}</Text>
      <Text size="xs" color="secondary" className="text-[10px] font-mono">{value}</Text>
    </Flex>
  )
}
