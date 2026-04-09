import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function EditorSettings() {
  const editor = useSettingsStore((s) => s.settings.editor)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Editor</Heading>
        <Text size="xs" color="muted" className="mt-1">Configure the SQL editor</Text>
      </div>

      <SettingRow label="Font Size" description="Editor font size in pixels">
        <NumberInput value={editor.fontSize} onChange={(v) => setSetting('editor.fontSize', v)} min={10} max={24} size="sm" className="w-20" />
      </SettingRow>

      <SettingRow label="Font Family" description="Font used in the editor">
        <Select value={editor.fontFamily} onChange={(e) => setSetting('editor.fontFamily', e.target.value)} size="sm" className="w-48">
          <option value="'JetBrains Mono', 'SF Mono', 'Fira Code', monospace">JetBrains Mono</option>
          <option value="'SF Mono', 'Fira Code', monospace">SF Mono</option>
          <option value="'Fira Code', monospace">Fira Code</option>
          <option value="'Cascadia Code', monospace">Cascadia Code</option>
          <option value="monospace">System Monospace</option>
        </Select>
      </SettingRow>

      <SettingRow label="Tab Size" description="Number of spaces per tab">
        <Select value={editor.tabSize} onChange={(e) => setSetting('editor.tabSize', parseInt(e.target.value))} size="sm" className="w-24">
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </Select>
      </SettingRow>

      <SettingRow label="Cursor Style" description="Shape of the editor cursor">
        <Select value={editor.cursorStyle} onChange={(e) => setSetting('editor.cursorStyle', e.target.value)} size="sm" className="w-28">
          <option value="line">Line</option>
          <option value="block">Block</option>
          <option value="underline">Underline</option>
        </Select>
      </SettingRow>

      <Divider />

      <SettingRow label="Word Wrap" description="Wrap long lines in the editor">
        <Switch label="Word wrap" checked={editor.wordWrap} onChange={(e) => setSetting('editor.wordWrap', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Minimap" description="Show code minimap on the right side">
        <Switch label="Minimap" checked={editor.minimap} onChange={(e) => setSetting('editor.minimap', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Line Numbers" description="Show line numbers in the gutter">
        <Switch label="Line numbers" checked={editor.lineNumbers} onChange={(e) => setSetting('editor.lineNumbers', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Bracket Matching" description="Highlight matching brackets">
        <Switch label="Bracket matching" checked={editor.bracketMatching} onChange={(e) => setSetting('editor.bracketMatching', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Ligatures" description="Enable font ligatures">
        <Switch label="Ligatures" checked={editor.ligatures} onChange={(e) => setSetting('editor.ligatures', e.target.checked)} />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('editor')}>Reset to Defaults</Button>
      </Flex>
    </Stack>
  )
}
