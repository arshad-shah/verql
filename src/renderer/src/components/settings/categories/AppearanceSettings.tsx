import { Stack, Grid, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Select, ColorInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives'
import { SettingRow } from '../SettingRow'
import type { Theme } from '@shared/settings'

const themePreview: Record<string, { bg: string; sidebar: string; text: string; accent: string; label: string }> = {
  dark: { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#b4befe', label: 'Dark' },
  light: { bg: '#eff1f5', sidebar: '#ccd0da', text: '#4c4f69', accent: '#7287fd', label: 'Light' },
  midnight: { bg: '#0d1117', sidebar: '#161b22', text: '#c9d1d9', accent: '#a78bfa', label: 'Midnight' },
  dracula: { bg: '#282a36', sidebar: '#44475a', text: '#f8f8f2', accent: '#bd93f9', label: 'Dracula' },
  nord: { bg: '#2e3440', sidebar: '#3b4252', text: '#eceff4', accent: '#88c0d0', label: 'Nord' },
  solarized: { bg: '#002b36', sidebar: '#073642', text: '#839496', accent: '#268bd2', label: 'Solarized' },
  catppuccin: { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#f5c2e7', label: 'Catppuccin' },
}

export function AppearanceSettings() {
  const appearance = useSettingsStore((s) => s.settings.appearance)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { theme: currentTheme, setTheme } = useTheme()

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Appearance</Heading>
        <Text size="xs" color="muted" className="mt-1">Customize how dbstudio looks and feels</Text>
      </div>

      <div>
        <Text size="sm" color="primary" className="mb-1">Theme</Text>
        <Text size="xs" color="muted" className="mb-3">Choose a color theme for the application</Text>
        <Grid columns={4} gap="sm">
          {Object.entries(themePreview).map(([key, preview]) => (
            <button
              key={key}
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
                <div className="flex-[2] rounded-sm" style={{ background: preview.bg, border: `1px solid ${preview.sidebar}` }} />
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
                {preview.label} {currentTheme === key ? '✓' : ''}
              </Text>
            </button>
          ))}
        </Grid>
      </div>

      <Divider />

      <SettingRow label="UI Density" description="Controls spacing and padding across the interface">
        <Select
          value={appearance.uiDensity}
          onChange={(e) => setSetting('appearance.uiDensity', e.target.value)}
          size="sm"
          className="w-32"
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </Select>
      </SettingRow>

      <SettingRow label="Sidebar Position" description="Place the sidebar on the left or right side">
        <Select
          value={appearance.sidebarPosition}
          onChange={(e) => setSetting('appearance.sidebarPosition', e.target.value)}
          size="sm"
          className="w-32"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Select>
      </SettingRow>

      <SettingRow label="Accent Color" description="Highlight color for active elements and focus rings">
        <ColorInput
          value={appearance.accentColor}
          onChange={(v) => setSetting('appearance.accentColor', v)}
          size="sm"
        />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('appearance')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
