import { Stack, Divider, Flex } from '@/primitives'
import { Button } from '@arshad-shah/cynosure-react/button'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Select } from '@arshad-shah/cynosure-react/select'
import { Input } from '@arshad-shah/cynosure-react/input'
import { NumberInput } from '@arshad-shah/cynosure-react/number-input'
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
      <Text size="xs" color="fg.subtle">{t('settings.dataDisplay.blurb')}</Text>

      <SettingRow label={t('settings.dataDisplay.nullDisplay.label')} description={t('settings.dataDisplay.nullDisplay.description')}>
        <Input value={display.nullDisplay} onChange={(v) => setSetting('dataDisplay.nullDisplay', v)} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.dateFormat.label')} description={t('settings.dataDisplay.dateFormat.description')}>
        <Select
          value={display.dateFormat}
          onValueChange={(val) => setSetting('dataDisplay.dateFormat', val)}
          size="sm"
          className="w-28"
          aria-label={t('settings.dataDisplay.dateFormat.label')}
          items={[
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
            onChange={(v) => setSetting('dataDisplay.customDateFormat', v)}
            size="sm"
            className="w-48"
            aria-label={t('settings.dataDisplay.customDatePattern.label')}
          />
        </SettingRow>
      )}

      <SettingRow label={t('settings.dataDisplay.booleanDisplay.label')} description={t('settings.dataDisplay.booleanDisplay.description')}>
        <Select
          value={display.booleanDisplay}
          onValueChange={(val) => setSetting('dataDisplay.booleanDisplay', val)}
          size="sm"
          className="w-32"
          aria-label={t('settings.dataDisplay.booleanDisplay.label')}
          items={[
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
          onValueChange={(val) => setSetting('dataDisplay.numberFormat', val)}
          size="sm"
          className="w-28"
          aria-label={t('settings.dataDisplay.numberFormat.label')}
          items={[
            { value: 'raw', label: t('settings.dataDisplay.numberFormat.raw') },
            { value: 'locale', label: t('settings.dataDisplay.numberFormat.locale') },
          ]}
        />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.maxColumnWidth.label')} description={t('settings.dataDisplay.maxColumnWidth.description')}>
        <NumberInput formatOptions={{ useGrouping: false }} value={display.maxColumnWidth} onChange={(v) => setSetting('dataDisplay.maxColumnWidth', v)} minValue={100} maxValue={800} step={50} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label={t('settings.dataDisplay.truncateTextAt.label')} description={t('settings.dataDisplay.truncateTextAt.description')}>
        <NumberInput formatOptions={{ useGrouping: false }} value={display.truncateTextAt} onChange={(v) => setSetting('dataDisplay.truncateTextAt', v)} minValue={0} maxValue={2000} step={50} size="sm" className="w-24" />
      </SettingRow>

      <PluginContributedSettings category="data-display" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" colorScheme="neutral" size="sm" onClick={() => resetCategory('dataDisplay')}>{t('common.resetToDefaults')}</Button>
      </Flex>
    </Stack>
  )
}
