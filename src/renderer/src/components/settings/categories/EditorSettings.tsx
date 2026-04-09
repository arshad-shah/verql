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
        <Select
          value={editor.fontFamily}
          onChange={(val) => setSetting('editor.fontFamily', val)}
          size="sm"
          className="w-48"
          aria-label="Font family"
          options={[
            { value: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", label: 'JetBrains Mono' },
            { value: "'SF Mono', 'Fira Code', monospace", label: 'SF Mono' },
            { value: "'Fira Code', monospace", label: 'Fira Code' },
            { value: "'Cascadia Code', monospace", label: 'Cascadia Code' },
            { value: 'monospace', label: 'System Monospace' },
          ]}
        />
      </SettingRow>

      <SettingRow label="Tab Size" description="Number of spaces per tab">
        <Select
          value={String(editor.tabSize)}
          onChange={(val) => setSetting('editor.tabSize', parseInt(val))}
          size="sm"
          className="w-24"
          aria-label="Tab size"
          options={[
            { value: '2', label: '2 spaces' },
            { value: '4', label: '4 spaces' },
          ]}
        />
      </SettingRow>

      <SettingRow label="Cursor Style" description="Shape of the editor cursor">
        <Select
          value={editor.cursorStyle}
          onChange={(val) => setSetting('editor.cursorStyle', val)}
          size="sm"
          className="w-28"
          aria-label="Cursor style"
          options={[
            { value: 'line', label: 'Line' },
            { value: 'block', label: 'Block' },
            { value: 'underline', label: 'Underline' },
          ]}
        />
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
