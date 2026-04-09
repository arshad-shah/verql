import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Input, Select, NumberInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function DataDisplaySettings() {
  const display = useSettingsStore((s) => s.settings.dataDisplay)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Data Display</Heading>
        <Text size="xs" color="muted" className="mt-1">How query results and table data are displayed</Text>
      </div>

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

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('dataDisplay')}>Reset to Defaults</Button>
      </Flex>
    </Stack>
  )
}
