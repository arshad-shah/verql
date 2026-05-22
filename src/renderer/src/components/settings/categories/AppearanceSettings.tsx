import { Check } from 'lucide-react'
import { Stack, Grid, Divider, Flex, Button, Heading, Text, Box, Switch } from '@/primitives'
import { Select, ColorInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import type { Theme } from '@shared/settings'
import { SettingLabel } from '@/components/settings/SettingLabel'

const themePreview: Record<string, { bg: string; sidebar: string; text: string; accent: string; label: string }> = {
  // Primary trio — the curated identity directions.
  nightshift: { bg: '#0B0F16', sidebar: '#131825', text: '#E8ECF3', accent: '#2bd9a3', label: 'Nightshift' },
  lab:        { bg: '#FAFAF6', sidebar: '#F1F0EA', text: '#1A1A1C', accent: '#115E59', label: 'Lab' },
  inkpaper:   { bg: '#F2EBDE', sidebar: '#ECE3D2', text: '#14110F', accent: '#9E3022', label: 'Ink & Paper' },
  // Legacy & community themes
  dark:       { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#b4befe', label: 'Dark' },
  light:      { bg: '#eff1f5', sidebar: '#ccd0da', text: '#4c4f69', accent: '#7287fd', label: 'Light' },
  midnight:   { bg: '#0d1117', sidebar: '#161b22', text: '#c9d1d9', accent: '#a78bfa', label: 'Midnight' },
  dracula:    { bg: '#282a36', sidebar: '#44475a', text: '#f8f8f2', accent: '#bd93f9', label: 'Dracula' },
  nord:       { bg: '#2e3440', sidebar: '#3b4252', text: '#eceff4', accent: '#88c0d0', label: 'Nord' },
  solarized:  { bg: '#002b36', sidebar: '#073642', text: '#839496', accent: '#268bd2', label: 'Solarized' },
  catppuccin: { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#f5c2e7', label: 'Catppuccin' },
}

export function AppearanceSettings() {
  const appearance = useSettingsStore((s) => s.settings.appearance)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { theme: currentTheme, setTheme } = useTheme()

  return (
    <Stack gap="md">
      <Box>
        <Heading level={4}>Appearance</Heading>
        <Text size="xs" color="muted" className="mt-1">Customize how verql looks and feels</Text>
      </Box>

      <Box>
        <SettingLabel label="Theme" description="Choose a color theme for the application" />
        <Grid columns={4} gap="sm">
          {Object.entries(themePreview).map(([key, preview]) => (
            <Box
              key={key}
              as="button"
              onClick={() => setTheme(key as Theme)}
              className={`rounded-lg border-2 p-2.5 transition-colors cursor-pointer ${
                currentTheme === key
                  ? 'border-accent'
                  : 'border-transparent hover:border-border-default'
              }`}
              style={{ background: preview.bg }}
            >
              <Flex gap="xs" className="mb-2 h-1.5">
                <div className="flex-1 rounded-sm" style={{ background: preview.sidebar }} />
                <div className="flex-2 rounded-sm" style={{ background: preview.bg, border: `1px solid ${preview.sidebar}` }} />
              </Flex>
              <Flex gap="xs" className="mb-1.5">
                <div className="h-0.5 w-3 rounded-sm" style={{ background: preview.text }} />
                <div className="h-0.5 w-5 rounded-sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Flex gap="xs">
                <div className="h-0.5 w-2 rounded-sm" style={{ background: preview.accent }} />
                <div className="h-0.5 w-4 rounded-sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Text size="xs" className="mt-2 text-center block" style={{ color: preview.text }}>
                {preview.label} {currentTheme === key && <Check size={10} className="inline ml-0.5" />}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>

      <Divider />

      <SettingRow label="UI Density" description="Controls spacing and padding across the interface">
        <Select
          value={appearance.uiDensity}
          onChange={(v) => setSetting('appearance.uiDensity', v)}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' },
          ]}
          size="sm"
          className="w-32"
        />
      </SettingRow>

      <SettingRow label="Sidebar Position" description="Place the sidebar on the left or right side">
        <Select
          value={appearance.sidebarPosition}
          onChange={(v) => setSetting('appearance.sidebarPosition', v)}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          size="sm"
          className="w-32"
        />
      </SettingRow>

      <SettingRow label="Accent Color" description="Highlight color for active elements and focus rings">
        <ColorInput
          value={appearance.accentColor}
          onChange={(v) => setSetting('appearance.accentColor', v)}
          size="sm"
        />
      </SettingRow>

      <Divider />

      <SettingRow label="Show status bar" description="Display the status bar at the bottom of the window">
        <Switch
          label="Show status bar"
          checked={appearance.showStatusBar}
          onChange={(e) => setSetting('appearance.showStatusBar', e.target.checked)}
        />
      </SettingRow>

      <SettingRow label="Show secondary sidebar" description="Show the right (secondary) sidebar by default">
        <Switch
          label="Show secondary sidebar"
          checked={appearance.showSecondarySidebar}
          onChange={(e) => setSetting('appearance.showSecondarySidebar', e.target.checked)}
        />
      </SettingRow>

      <SettingRow label="Show bottom dock" description="Show the bottom dock by default when there's content to display">
        <Switch
          label="Show bottom dock"
          checked={appearance.showBottomDock}
          onChange={(e) => setSetting('appearance.showBottomDock', e.target.checked)}
        />
      </SettingRow>

      <SettingRow label="Animations" description="Animate menus, dropdowns, and transitions">
        <Switch
          label="Animations"
          checked={appearance.animations}
          onChange={(e) => setSetting('appearance.animations', e.target.checked)}
        />
      </SettingRow>

      <PluginContributedSettings category="appearance" />

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('appearance')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
