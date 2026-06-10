import { Stack, Divider, Flex, Button, Text } from '@/primitives'
import { Switch } from '@arshad-shah/cynosure-react/switch'
import { VisuallyHidden } from '@arshad-shah/cynosure-react'
import { Select, ColorInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives'
import { useThemesStore } from '@/stores/themes'
import { useTranslation } from '@/i18n/I18nProvider'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { ThemeControls } from './ThemeControls'

// Default accent preview, used when the active theme declares no preview swatch.
const FALLBACK_PREVIEW = { bg: '#0B0F16', sidebar: '#131825', text: '#E8ECF3', accent: '#2bd9a3' }

export function AppearanceSettings() {
  const { t } = useTranslation()
  const appearance = useSettingsStore((s) => s.settings.appearance)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { theme: currentTheme } = useTheme()
  const themes = useThemesStore((s) => s.themes)

  const currentPreview = themes.find((t) => t.id === currentTheme)?.preview ?? FALLBACK_PREVIEW

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">{t('settings.appearance.blurb')}</Text>

      {/* Mode selector + theme-picker grids — first Cynosure-migrated UI. */}
      <ThemeControls />

      <Divider />

      <SettingRow label={t('settings.appearance.uiDensity.label')} description={t('settings.appearance.uiDensity.description')}>
        <Select
          value={appearance.uiDensity}
          onChange={(v) => setSetting('appearance.uiDensity', v)}
          options={[
            { value: 'compact', label: t('settings.appearance.uiDensity.compact') },
            { value: 'comfortable', label: t('settings.appearance.uiDensity.comfortable') },
            { value: 'spacious', label: t('settings.appearance.uiDensity.spacious') },
          ]}
          size="sm"
          className="w-32"
        />
      </SettingRow>

      <SettingRow label={t('settings.appearance.sidebarPosition.label')} description={t('settings.appearance.sidebarPosition.description')}>
        <Select
          value={appearance.sidebarPosition}
          onChange={(v) => setSetting('appearance.sidebarPosition', v)}
          options={[
            { value: 'left', label: t('settings.appearance.sidebarPosition.left') },
            { value: 'right', label: t('settings.appearance.sidebarPosition.right') },
          ]}
          size="sm"
          className="w-32"
        />
      </SettingRow>

      <SettingRow
        label={t('settings.appearance.accentColor.label')}
        description={
          appearance.accentColor
            ? t('settings.appearance.accentColor.descriptionCustom')
            : t('settings.appearance.accentColor.descriptionDefault')
        }
      >
        <Flex gap="sm" align="center">
          <ColorInput
            value={appearance.accentColor || currentPreview.accent}
            onChange={(v) => setSetting('appearance.accentColor', v)}
            size="sm"
          />
          {appearance.accentColor && (
            <Button variant="ghost" size="sm" onClick={() => setSetting('appearance.accentColor', '')}>
              {t('settings.appearance.accentColor.useThemeDefault')}
            </Button>
          )}
        </Flex>
      </SettingRow>

      <Divider />

      <SettingRow label={t('settings.appearance.showStatusBar.label')} description={t('settings.appearance.showStatusBar.description')}>
        <Switch size="lg"
          checked={appearance.showStatusBar}
          onCheckedChange={(checked) => setSetting('appearance.showStatusBar', checked)}
        >
          <VisuallyHidden>{t('settings.appearance.showStatusBar.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.appearance.showSecondarySidebar.label')} description={t('settings.appearance.showSecondarySidebar.description')}>
        <Switch size="lg"
          checked={appearance.showSecondarySidebar}
          onCheckedChange={(checked) => setSetting('appearance.showSecondarySidebar', checked)}
        >
          <VisuallyHidden>{t('settings.appearance.showSecondarySidebar.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.appearance.showBottomDock.label')} description={t('settings.appearance.showBottomDock.description')}>
        <Switch size="lg"
          checked={appearance.showBottomDock}
          onCheckedChange={(checked) => setSetting('appearance.showBottomDock', checked)}
        >
          <VisuallyHidden>{t('settings.appearance.showBottomDock.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <SettingRow label={t('settings.appearance.animations.label')} description={t('settings.appearance.animations.description')}>
        <Switch size="lg"
          checked={appearance.animations}
          onCheckedChange={(checked) => setSetting('appearance.animations', checked)}
        >
          <VisuallyHidden>{t('settings.appearance.animations.label')}</VisuallyHidden>
        </Switch>
      </SettingRow>

      <PluginContributedSettings category="appearance" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('appearance')}>
          {t('common.resetToDefaults')}
        </Button>
      </Flex>
    </Stack>
  )
}
