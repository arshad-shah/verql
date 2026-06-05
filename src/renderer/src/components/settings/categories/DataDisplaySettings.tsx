import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { Input, Select, NumberInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function DataDisplaySettings() {
  const display = useSettingsStore((s) => s.settings.dataDisplay)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">How query results and table data are displayed</Text>

      <SettingRow label="Null Display" description="Text shown for NULL values in results">
        <Input value={display.nullDisplay} onChange={(e) => setSetting('dataDisplay.nullDisplay', e.target.value)} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label="Date Format" description="How date values are formatted">
        <Select
          value={display.dateFormat}
          onChange={(val) => setSetting('dataDisplay.dateFormat', val)}
          size="sm"
          className="w-28"
          aria-label="Date format"
          options={[
            { value: 'iso', label: 'ISO 8601' },
            { value: 'locale', label: 'Locale' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
      </SettingRow>

      {display.dateFormat === 'custom' && (
        <SettingRow
          label="Custom Date Pattern"
          description="Tokens: yyyy MM dd HH mm ss SSS — e.g. yyyy-MM-dd HH:mm:ss"
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

      <SettingRow label="Boolean Display" description="How boolean values are rendered in results">
        <Select
          value={display.booleanDisplay}
          onChange={(val) => setSetting('dataDisplay.booleanDisplay', val)}
          size="sm"
          className="w-32"
          aria-label="Boolean display"
          options={[
            { value: 'true_false', label: 'true / false' },
            { value: 'one_zero', label: '1 / 0' },
            { value: 'yes_no', label: 'Yes / No' },
            { value: 'checkmark', label: '✓ / ✗' },
          ]}
        />
      </SettingRow>

      <SettingRow label="Number Format" description="How numeric values are formatted">
        <Select
          value={display.numberFormat}
          onChange={(val) => setSetting('dataDisplay.numberFormat', val)}
          size="sm"
          className="w-28"
          aria-label="Number format"
          options={[
            { value: 'raw', label: 'Raw' },
            { value: 'locale', label: 'Locale' },
          ]}
        />
      </SettingRow>

      <SettingRow label="Max Column Width" description="Maximum width in pixels for result columns">
        <NumberInput value={display.maxColumnWidth} onChange={(v) => setSetting('dataDisplay.maxColumnWidth', v)} min={100} max={800} step={50} size="sm" className="w-24" />
      </SettingRow>

      <SettingRow label="Truncate Text At" description="Trim long text cells to this many characters; the full value shows in a tooltip. 0 disables.">
        <NumberInput value={display.truncateTextAt} onChange={(v) => setSetting('dataDisplay.truncateTextAt', v)} min={0} max={2000} step={50} size="sm" className="w-24" />
      </SettingRow>

      <PluginContributedSettings category="data-display" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('dataDisplay')}>Reset to Defaults</Button>
      </Flex>
    </Stack>
  )
}
