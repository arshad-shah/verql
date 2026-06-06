import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { Input, Select, NumberInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTranslation } from '@/i18n/I18nProvider'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function DataDisplaySettings() {
  const { t } = useTranslation()
  const display = useSettingsStore((s) => s.settings.dataDisplay)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">{t('settings.dataDisplay.blurb')}</Text>

      <SettingRow label={t('settings.dataDisplay.nullDisplay.label')} description={t('settings.dataDisplay.nullDisplay.description')}>
        <Input value={display.nullDisplay} onChange={(e) => setSetting('dataDisplay.nullDisplay', e.target.value)} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.dateFormat.label')} description={t('settings.dataDisplay.dateFormat.description')}>
        <Select
          value={display.dateFormat}
          onChange={(val) => setSetting('dataDisplay.dateFormat', val)}
          size="sm"
          className="w-28"
          aria-label="Date format"
          options={[
            { value: 'iso', label: t('settings.dataDisplay.dateFormat.iso') },
            { value: 'locale', label: t('settings.dataDisplay.dateFormat.locale') },
            { value: 'custom', label: t('settings.dataDisplay.dateFormat.custom') },
          ]}
        />
      </SettingRow>

      {display.dateFormat === 'custom' && (
        <SettingRow
          label={t('settings.dataDisplay.customDatePattern.label')}
          description={t('settings.dataDisplay.customDatePattern.description')}
        >
          <Input
            value={display.customDateFormat}
            onChange={(e) => setSetting('dataDisplay.customDateFormat', e.target.value)}
            size="sm"
            className="w-48"
            aria-label="Custom date pattern"
          />
        </SettingRow>
      )}

      <SettingRow label={t('settings.dataDisplay.booleanDisplay.label')} description={t('settings.dataDisplay.booleanDisplay.description')}>
        <Select
          value={display.booleanDisplay}
          onChange={(val) => setSetting('dataDisplay.booleanDisplay', val)}
          size="sm"
          className="w-32"
          aria-label="Boolean display"
          options={[
            { value: 'true_false', label: t('settings.dataDisplay.booleanDisplay.trueFalse') },
            { value: 'one_zero', label: t('settings.dataDisplay.booleanDisplay.oneZero') },
            { value: 'yes_no', label: t('settings.dataDisplay.booleanDisplay.yesNo') },
            { value: 'checkmark', label: t('settings.dataDisplay.booleanDisplay.checkmark') },
          ]}
        />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.numberFormat.label')} description={t('settings.dataDisplay.numberFormat.description')}>
        <Select
          value={display.numberFormat}
          onChange={(val) => setSetting('dataDisplay.numberFormat', val)}
          size="sm"
          className="w-28"
          aria-label="Number format"
          options={[
            { value: 'raw', label: t('settings.dataDisplay.numberFormat.raw') },
            { value: 'locale', label: t('settings.dataDisplay.numberFormat.locale') },
          ]}
        />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.maxColumnWidth.label')} description={t('settings.dataDisplay.maxColumnWidth.description')}>
        <NumberInput value={display.maxColumnWidth} onChange={(v) => setSetting('dataDisplay.maxColumnWidth', v)} min={100} max={800} step={50} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.truncateTextAt.label')} description={t('settings.dataDisplay.truncateTextAt.description')}>
        <NumberInput value={display.truncateTextAt} onChange={(v) => setSetting('dataDisplay.truncateTextAt', v)} min={0} max={2000} step={50} size="sm" className="w-24" />
      </SettingRow>

      <PluginContributedSettings category="data-display" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('dataDisplay')}>{t('common.resetToDefaults')}</Button>
      </Flex>
    </Stack>
  )
}
