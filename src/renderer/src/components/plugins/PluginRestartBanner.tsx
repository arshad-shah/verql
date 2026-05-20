import { usePluginLifecycleStore } from '@/stores/plugin-lifecycle'
import { Button, Flex, Text } from '@/primitives'

/**
 * Banner that appears whenever a plugin is activated, deactivated, installed,
 * or uninstalled. Plugin contributions tear down cleanly via Disposables, but
 * UI components that captured handles to plugin state may need a fresh process
 * to fully reset — surface that to the user without forcing the issue.
 */
export function PluginRestartBanner() {
  const pending = usePluginLifecycleStore((s) => s.pending)
  const restart = usePluginLifecycleStore((s) => s.restart)
  const dismiss = usePluginLifecycleStore((s) => s.dismiss)

  if (!pending) return null

  const verb = ({
    activated: 'enabled',
    deactivated: 'disabled',
    installed: 'installed',
    uninstalled: 'uninstalled'
  } as const)[pending.event]

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        maxWidth: 460
      }}
    >
      <Flex direction="column" gap="xs">
        <Text size="sm">
          Plugin <strong>{pending.name}</strong> was {verb}. Restart to apply cleanly.
        </Text>
        <Flex gap="xs" justify="end">
          <Button size="sm" variant="ghost" onClick={dismiss}>Later</Button>
          <Button size="sm" onClick={restart}>Restart</Button>
        </Flex>
      </Flex>
    </div>
  )
}
