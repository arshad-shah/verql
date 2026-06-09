import { Stack, Divider, Flex, Switch } from '@/primitives'
import { Button } from '@arshad-shah/cynosure-react/button'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Select } from '@/primitives'
import { NumberInput } from '@arshad-shah/cynosure-react/number-input'
import { useSettingsStore } from '@/stores/settings'
import { useTranslation } from '@/i18n/I18nProvider'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { UpdatesSection } from '../UpdatesSection'

export function GeneralSettings() {
  const general = useSettingsStore((s) => s.settings.general)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { t } = useTranslation()

  return (
    <Stack gap="md">
      <Text size="xs" color="fg.subtle">{t('settings.general.blurb')}</Text>

      <SettingRow label={t('settings.general.queryTimeout.label')} description={t('settings.general.queryTimeout.description')}>
        <NumberInput
          value={general.queryTimeout}
          onChange={(v) => setSetting('general.queryTimeout', v)}
          minValue={5}
          maxValue={300}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label={t('settings.general.maxHistoryItems.label')} description={t('settings.general.maxHistoryItems.description')}>
        <NumberInput
          value={general.maxHistoryItems}
          onChange={(v) => setSetting('general.maxHistoryItems', v)}
          minValue={50}
          maxValue={1000}
          step={50}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label={t('settings.general.defaultPageSize.label')} description={t('settings.general.defaultPageSize.description')}>
        <Select
          value={String(general.defaultPageSize)}
          onChange={(val) => setSetting('general.defaultPageSize', parseInt(val))}
          size="sm"
          className="w-24"
          aria-label={t('settings.general.defaultPageSize.label')}
          options={[
            { value: '50', label: '50' },
            { value: '100', label: '100' },
            { value: '500', label: '500' },
            { value: '1000', label: '1000' },
          ]}
        />
      </SettingRow>

      <Divider />

      <SettingRow
        label={t('settings.general.confirmDestructive.label')}
        description={t('settings.general.confirmDestructive.description')}
      >
        <Switch
          label={t('settings.general.confirmDestructive.label')}
          checked={general.confirmDestructiveQueries}
          onChange={(e) => setSetting('general.confirmDestructiveQueries', e.target.checked)}
        />
      </SettingRow>

      <SettingRow
        label={t('settings.general.confirmUnsavedClose.label')}
        description={t('settings.general.confirmUnsavedClose.description')}
      >
        <Switch
          label={t('settings.general.confirmUnsavedClose.label')}
          checked={general.confirmOnUnsavedClose}
          onChange={(e) => setSetting('general.confirmOnUnsavedClose', e.target.checked)}
        />
      </SettingRow>

      <SettingRow
        label={t('settings.general.restoreTabs.label')}
        description={t('settings.general.restoreTabs.description')}
      >
        <Switch
          label={t('settings.general.restoreTabs.label')}
          checked={general.restoreTabsOnStartup}
          onChange={(e) => setSetting('general.restoreTabsOnStartup', e.target.checked)}
        />
      </SettingRow>

      <PluginContributedSettings category="general" />

      <Divider />

      <UpdatesSection />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" colorScheme="neutral" size="sm" onClick={() => resetCategory('general')}>
          {t('common.resetToDefaults')}
        </Button>
      </Flex>
    </Stack>
  )
}
