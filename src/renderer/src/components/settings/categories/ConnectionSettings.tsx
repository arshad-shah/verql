import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { Select, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function ConnectionSettings() {
  const conn = useSettingsStore((s) => s.settings.connectionDefaults)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">
        Defaults for new database connections. Per-driver settings (ports,
        driver-specific options) live with the driver plugin and only show
        here while that plugin is active.
      </Text>

      <SettingRow label="Auto Reconnect" description="Automatically reconnect when a connection is lost">
        <Switch
          label="Auto reconnect"
          checked={conn.autoReconnect}
          onChange={(e) => setSetting('connectionDefaults.autoReconnect', e.target.checked)}
        />
      </SettingRow>

      <SettingRow label="Default SSL Mode" description="SSL mode for new connections">
        <Select
          value={conn.defaultSslMode}
          onChange={(val) => setSetting('connectionDefaults.defaultSslMode', val)}
          size="sm"
          className="w-28"
          aria-label="Default SSL mode"
          options={[
            { value: 'disable', label: 'Disable' },
            { value: 'prefer', label: 'Prefer' },
            { value: 'require', label: 'Require' },
          ]}
        />
      </SettingRow>

      <PluginContributedSettings category="connections" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('connectionDefaults')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
