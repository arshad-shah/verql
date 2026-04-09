import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function GeneralSettings() {
  const general = useSettingsStore((s) => s.settings.general)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>General</Heading>
        <Text size="xs" color="muted" className="mt-1">Basic application settings</Text>
      </div>

      <SettingRow label="Query Timeout" description="Maximum time in seconds before a query is cancelled">
        <NumberInput
          value={general.queryTimeout}
          onChange={(v) => setSetting('general.queryTimeout', v)}
          min={5}
          max={300}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label="Max History Items" description="Number of recent queries to keep in history">
        <NumberInput
          value={general.maxHistoryItems}
          onChange={(v) => setSetting('general.maxHistoryItems', v)}
          min={50}
          max={1000}
          step={50}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label="Default Page Size" description="Number of rows to fetch per page when browsing tables">
        <Select
          value={general.defaultPageSize}
          onChange={(e) => setSetting('general.defaultPageSize', parseInt(e.target.value))}
          size="sm"
          className="w-24"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </Select>
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('general')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
