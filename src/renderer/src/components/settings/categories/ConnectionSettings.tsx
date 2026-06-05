import { Stack, Text } from '@/primitives'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function ConnectionSettings() {
  return (
    <Stack gap="md">
      <Text size="xs" color="muted">
        Connection options are owned by the database driver plugins. Per-driver
        settings (SSL, ports, driver-specific options) live with the driver and
        only show here while that plugin is active. Configure SSL and similar
        options per connection in the connection form.
      </Text>

      <PluginContributedSettings category="connections" />
    </Stack>
  )
}
