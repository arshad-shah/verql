import { usePluginLifecycleStore } from '@/stores/plugin-lifecycle'
import { useTranslation } from '@/i18n/I18nProvider'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Button } from '@arshad-shah/cynosure-react/button'

/**
 * Banner that appears whenever a plugin is activated, deactivated, installed,
 * or uninstalled. Plugin contributions tear down cleanly via Disposables, but
 * UI components that captured handles to plugin state may need a fresh process
 * to fully reset — surface that to the user without forcing the issue.
 */
export function PluginRestartBanner() {
  const { t } = useTranslation()
  const pending = usePluginLifecycleStore((s) => s.pending)
  const restart = usePluginLifecycleStore((s) => s.restart)
  const dismiss = usePluginLifecycleStore((s) => s.dismiss)

  if (!pending) return null

  const verb = ({
    activated: t('plugins.restart.verbActivated'),
    deactivated: t('plugins.restart.verbDeactivated'),
    installed: t('plugins.restart.verbInstalled'),
    uninstalled: t('plugins.restart.verbUninstalled')
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
      <Flex direction="column" gap="1">
        <Text size="sm">
          {t('plugins.restart.messagePrefix')} <strong>{pending.name}</strong> {t('plugins.restart.messageSuffix', { verb })}
        </Text>
        <Flex gap="1" justify="end">
          <Button size="sm" variant="ghost" colorScheme="neutral" onClick={dismiss}>{t('plugins.restart.later')}</Button>
          <Button size="sm" onClick={restart}>{t('plugins.restart.restart')}</Button>
        </Flex>
      </Flex>
    </div>
  )
}
