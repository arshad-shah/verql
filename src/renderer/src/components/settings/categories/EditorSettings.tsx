import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { NumberInput, Select } from '@/primitives'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import { useSettingsStore } from '@/stores/settings'
import { useTranslation } from '@/i18n/I18nProvider'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'

export function EditorSettings() {
  const { t } = useTranslation()
  const editor = useSettingsStore((s) => s.settings.editor)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">{t('settings.editor.blurb')}</Text>

      <SettingRow label={t('settings.editor.fontSize.label')} description={t('settings.editor.fontSize.description')}>
        <NumberInput value={editor.fontSize} onChange={(v) => setSetting('editor.fontSize', v)} min={10} max={24} size="sm" />
      </SettingRow>

      <SettingRow label={t('settings.editor.fontFamily.label')} description={t('settings.editor.fontFamily.description')}>
        <Select
          value={editor.fontFamily}
          onChange={(val) => setSetting('editor.fontFamily', val)}
          size="sm"
          className="w-48"
          aria-label={t('settings.editor.fontFamily.label')}
          options={[
            { value: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", label: t('settings.editor.fontFamily.jetBrainsMono') },
            { value: "'SF Mono', 'Fira Code', monospace", label: t('settings.editor.fontFamily.sfMono') },
            { value: "'Fira Code', monospace", label: t('settings.editor.fontFamily.firaCode') },
            { value: "'Cascadia Code', monospace", label: t('settings.editor.fontFamily.cascadiaCode') },
            { value: 'monospace', label: t('settings.editor.fontFamily.systemMonospace') },
          ]}
        />
      </SettingRow>

      <SettingRow label={t('settings.editor.tabSize.label')} description={t('settings.editor.tabSize.description')}>
        <Select
          value={String(editor.tabSize)}
          onChange={(val) => setSetting('editor.tabSize', parseInt(val))}
          size="sm"
          className="w-24"
          aria-label={t('settings.editor.tabSize.label')}
          options={[
            { value: '2', label: t('settings.editor.tabSize.two') },
            { value: '4', label: t('settings.editor.tabSize.four') },
          ]}
        />
      </SettingRow>

      <SettingRow label={t('settings.editor.cursorStyle.label')} description={t('settings.editor.cursorStyle.description')}>
        <Select
          value={editor.cursorStyle}
          onChange={(val) => setSetting('editor.cursorStyle', val)}
          size="sm"
          className="w-28"
          aria-label={t('settings.editor.cursorStyle.label')}
          options={[
            { value: 'line', label: t('settings.editor.cursorStyle.line') },
            { value: 'block', label: t('settings.editor.cursorStyle.block') },
            { value: 'underline', label: t('settings.editor.cursorStyle.underline') },
          ]}
        />
      </SettingRow>

      <Divider />

      <SettingRow label={t('settings.editor.wordWrap.label')} description={t('settings.editor.wordWrap.description')}>
        <Switch size="lg" checked={editor.wordWrap} onCheckedChange={(checked) => setSetting('editor.wordWrap', checked)}>
          <VisuallyHidden>{t('settings.editor.wordWrap.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.minimap.label')} description={t('settings.editor.minimap.description')}>
        <Switch size="lg" checked={editor.minimap} onCheckedChange={(checked) => setSetting('editor.minimap', checked)}>
          <VisuallyHidden>{t('settings.editor.minimap.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.lineNumbers.label')} description={t('settings.editor.lineNumbers.description')}>
        <Switch size="lg" checked={editor.lineNumbers} onCheckedChange={(checked) => setSetting('editor.lineNumbers', checked)}>
          <VisuallyHidden>{t('settings.editor.lineNumbers.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.bracketMatching.label')} description={t('settings.editor.bracketMatching.description')}>
        <Switch size="lg" checked={editor.bracketMatching} onCheckedChange={(checked) => setSetting('editor.bracketMatching', checked)}>
          <VisuallyHidden>{t('settings.editor.bracketMatching.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.ligatures.label')} description={t('settings.editor.ligatures.description')}>
        <Switch size="lg" checked={editor.ligatures} onCheckedChange={(checked) => setSetting('editor.ligatures', checked)}>
          <VisuallyHidden>{t('settings.editor.ligatures.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.highlightActiveLine.label')} description={t('settings.editor.highlightActiveLine.description')}>
        <Switch size="lg"
          checked={editor.highlightActiveLine}
          onCheckedChange={(checked) => setSetting('editor.highlightActiveLine', checked)}
        >
          <VisuallyHidden>{t('settings.editor.highlightActiveLine.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.autoClosingBrackets.label')} description={t('settings.editor.autoClosingBrackets.description')}>
        <Switch size="lg"
          checked={editor.autoClosingBrackets}
          onCheckedChange={(checked) => setSetting('editor.autoClosingBrackets', checked)}
        >
          <VisuallyHidden>{t('settings.editor.autoClosingBrackets.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.smoothCursor.label')} description={t('settings.editor.smoothCursor.description')}>
        <Switch size="lg"
          checked={editor.smoothCursor}
          onCheckedChange={(checked) => setSetting('editor.smoothCursor', checked)}
        >
          <VisuallyHidden>{t('settings.editor.smoothCursor.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.editor.scrollPastEnd.label')} description={t('settings.editor.scrollPastEnd.description')}>
        <Switch size="lg"
          checked={editor.scrollPastEnd}
          onCheckedChange={(checked) => setSetting('editor.scrollPastEnd', checked)}
        >
          <VisuallyHidden>{t('settings.editor.scrollPastEnd.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <PluginContributedSettings category="editor" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('editor')}>{t('common.resetToDefaults')}</Button>
      </Flex>
    </Stack>
  )
}
