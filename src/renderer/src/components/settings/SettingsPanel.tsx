import { useState } from 'react'
import { Stack, Flex, Divider } from '@/primitives'
import { Heading, Text } from '@/primitives'
import { Input, Select, Checkbox, Label } from '@/primitives'

interface Settings {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  queryTimeout: number
  maxHistoryItems: number
  defaultPageSize: number
}

const defaultSettings: Settings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  queryTimeout: 30,
  maxHistoryItems: 200,
  defaultPageSize: 100
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(s => ({ ...s, [key]: value }))
  }

  return (
    <Stack gap="lg" className="p-4 max-w-lg">
      <Heading level={6}>Settings</Heading>

      {/* Editor */}
      <Stack gap="sm">
        <Text size="xs" color="muted" className="uppercase tracking-wider">Editor</Text>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Font Size</Text></Label>
          <Input
            type="number"
            value={settings.fontSize}
            onChange={e => update('fontSize', parseInt(e.target.value) || 14)}
            min={10}
            max={24}
            size="sm"
            className="w-16 text-right"
          />
        </Flex>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Tab Size</Text></Label>
          <Select
            value={settings.tabSize}
            onChange={e => update('tabSize', parseInt(e.target.value))}
            size="sm"
            className="w-28"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </Select>
        </Flex>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Word Wrap</Text></Label>
          <Checkbox checked={settings.wordWrap} onChange={e => update('wordWrap', e.target.checked)} />
        </Flex>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Minimap</Text></Label>
          <Checkbox checked={settings.minimap} onChange={e => update('minimap', e.target.checked)} />
        </Flex>
      </Stack>

      <Divider />

      {/* Query */}
      <Stack gap="sm">
        <Text size="xs" color="muted" className="uppercase tracking-wider">Query Execution</Text>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Timeout (seconds)</Text></Label>
          <Input
            type="number"
            value={settings.queryTimeout}
            onChange={e => update('queryTimeout', parseInt(e.target.value) || 30)}
            min={5}
            max={300}
            size="sm"
            className="w-16 text-right"
          />
        </Flex>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Default Page Size</Text></Label>
          <Select
            value={settings.defaultPageSize}
            onChange={e => update('defaultPageSize', parseInt(e.target.value))}
            size="sm"
            className="w-28"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </Select>
        </Flex>
        <Flex direction="row" align="center" justify="between">
          <Label><Text size="xs" color="secondary">Max History Items</Text></Label>
          <Input
            type="number"
            value={settings.maxHistoryItems}
            onChange={e => update('maxHistoryItems', parseInt(e.target.value) || 200)}
            min={50}
            max={1000}
            size="sm"
            className="w-16 text-right"
          />
        </Flex>
      </Stack>

      <Text size="xs" color="muted" className="text-[10px]">Settings are saved automatically.</Text>
    </Stack>
  )
}
