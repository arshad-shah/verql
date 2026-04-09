import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function ConnectionSettings() {
  const conn = useSettingsStore((s) => s.settings.connectionDefaults)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Connections</Heading>
        <Text size="xs" color="muted" className="mt-1">Default settings for new database connections</Text>
      </div>

      <SettingRow label="Auto Reconnect" description="Automatically reconnect when a connection is lost">
        <Switch label="Auto reconnect" checked={conn.autoReconnect} onChange={(e) => setSetting('connectionDefaults.autoReconnect', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Default SSL Mode" description="SSL mode for new connections">
        <Select value={conn.defaultSslMode} onChange={(e) => setSetting('connectionDefaults.defaultSslMode', e.target.value)} size="sm" className="w-28">
          <option value="disable">Disable</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
        </Select>
      </SettingRow>

      <Divider />

      <Text size="xs" color="muted" className="uppercase tracking-wider font-semibold">Default Ports</Text>

      {Object.entries(conn.defaultPorts).map(([dbType, port]) => (
        <SettingRow key={dbType} label={dbType} description={`Default port for ${dbType} connections`}>
          <NumberInput value={port} onChange={(v) => setSetting(`connectionDefaults.defaultPorts.${dbType}`, v)} min={1} max={65535} size="sm" className="w-24" />
        </SettingRow>
      ))}

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('connectionDefaults')}>Reset to Defaults</Button>
      </Flex>
    </Stack>
  )
}
