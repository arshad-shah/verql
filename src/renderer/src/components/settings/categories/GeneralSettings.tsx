import { Stack, Divider, Flex, Button, Heading, Text, Switch } from '@/primitives'
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
          value={String(general.defaultPageSize)}
          onChange={(val) => setSetting('general.defaultPageSize', parseInt(val))}
          size="sm"
          className="w-24"
          aria-label="Default page size"
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
        label="Confirm destructive queries"
        description="Show a confirmation dialog before running DELETE, DROP, TRUNCATE, or UPDATE without WHERE"
      >
        <Switch
          label="Confirm destructive queries"
          checked={general.confirmDestructiveQueries}
          onChange={(e) => setSetting('general.confirmDestructiveQueries', e.target.checked)}
        />
      </SettingRow>

      <SettingRow
        label="Confirm on unsaved close"
        description="Ask before closing a tab that has unsaved changes"
      >
        <Switch
          label="Confirm on unsaved close"
          checked={general.confirmOnUnsavedClose}
          onChange={(e) => setSetting('general.confirmOnUnsavedClose', e.target.checked)}
        />
      </SettingRow>

      <SettingRow
        label="Restore tabs on startup"
        description="Re-open the tabs that were active when the app last quit"
      >
        <Switch
          label="Restore tabs on startup"
          checked={general.restoreTabsOnStartup}
          onChange={(e) => setSetting('general.restoreTabsOnStartup', e.target.checked)}
        />
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
