import { Stack, Text } from '@/primitives'
import { useTranslation } from '@/i18n/I18nProvider'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function ConnectionSettings() {
  const { t } = useTranslation()
  return (
    <Stack gap="md">
      <Text size="xs" color="muted">
        {t('settings.connections.blurb')}
      </Text>

      <PluginContributedSettings category="connections" />
    </Stack>
  )
}
