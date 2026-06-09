import { Stack } from '@/primitives'
import { Text } from '@arshad-shah/cynosure-react/text'
import { useTranslation } from '@/i18n/I18nProvider'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function ConnectionSettings() {
  const { t } = useTranslation()
  return (
    <Stack gap="md">
      <Text size="xs" color="fg.subtle">
        {t('settings.connections.blurb')}
      </Text>

      <PluginContributedSettings category="connections" />
    </Stack>
  )
}
