import { Check, Sun, Moon, Monitor, AlertTriangle } from 'lucide-react'
import { Stack, Grid, Divider, Flex, Button, Text, Box, Switch } from '@/primitives'
import { Select, ColorInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives'
import { useThemesStore } from '@/stores/themes'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { SettingLabel } from '@/components/settings/SettingLabel'

const FALLBACK_PREVIEW = { bg: '#0B0F16', sidebar: '#131825', text: '#E8ECF3', accent: '#2bd9a3' }

const MODE_OPTIONS: { id: 'light' | 'dark' | 'system'; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

type ThemeGridItem = {
  id: string
  name: string
  preview?: { bg: string; sidebar: string; text: string; accent: string }
  validation?: { ok: boolean; missingRequired: string[]; missingRecommended: string[] }
}

function ThemeGrid({
  title,
  list,
  currentTheme,
  setTheme,
}: {
  title: string
  list: ThemeGridItem[]
  currentTheme: string
  setTheme: (id: string) => void
}) {
  if (list.length === 0) return null
  return (
    <Box>
      <SettingLabel label={title} description="" />
      <Grid columns={4} gap="sm">
        {list.map((t) => {
          const preview = t.preview ?? FALLBACK_PREVIEW
          const v = t.validation
          const hasError = v && !v.ok
          const hasWarning = v && v.ok && v.missingRecommended.length > 0
          const badgeTooltip = hasError
            ? `Missing required tokens: ${v!.missingRequired.join(', ')}`
            : hasWarning
              ? `Missing recommended tokens: ${v!.missingRecommended.join(', ')}`
              : undefined
          return (
            <Box
              key={t.id}
              as="button"
              onClick={() => setTheme(t.id)}
              className={`relative rounded-lg border-2 p-2.5 transition-colors cursor-pointer ${
                currentTheme === t.id
                  ? 'border-accent'
                  : hasError
                    ? 'border-error/50 hover:border-error'
                    : 'border-transparent hover:border-border-default'
              }`}
              style={{ background: preview.bg }}
              title={badgeTooltip}
            >
              {(hasError || hasWarning) && (
                <span
                  className={`absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-full p-0.5 ${
                    hasError ? 'bg-error text-white' : 'bg-warning text-black/80'
                  }`}
                  aria-label={badgeTooltip}
                >
                  <AlertTriangle size={9} />
                </span>
              )}
              <Flex gap="xs" className="mb-2 h-1.5">
                <div className="flex-1 rounded-sm" style={{ background: preview.sidebar }} />
                <div
                  className="flex-2 rounded-sm"
                  style={{ background: preview.bg, border: `1px solid ${preview.sidebar}` }}
                />
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
                {t.name} {currentTheme === t.id && <Check size={10} className="inline ml-0.5" />}
              </Text>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

export function AppearanceSettings() {
  const appearance = useSettingsStore((s) => s.settings.appearance)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { theme: currentTheme, setTheme, mode, setMode } = useTheme()
  const themes = useThemesStore((s) => s.themes)

  const currentPreview = themes.find((t) => t.id === currentTheme)?.preview ?? FALLBACK_PREVIEW

  // Split theme list by type so the picker groups dark + light. Picking
  // a theme also pins it as the preference for its side, so flipping
  // mode later still lands on the user's preferred theme for that mode.
  const darkThemes = themes.filter((t) => t.type === 'dark')
  const lightThemes = themes.filter((t) => t.type === 'light')

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">Customize how verql looks and feels</Text>

      <Box>
        <SettingLabel label="Color Mode" description="Light, dark, or follow the operating system" />
        <Flex gap="xs">
          {MODE_OPTIONS.map(({ id, label, Icon }) => (
            <Box
              key={id}
              as="button"
              onClick={() => setMode(id)}
              className={`flex-1 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                mode === id
                  ? 'border-accent bg-accent-muted text-text-primary'
                  : 'border-border-default bg-transparent text-text-secondary hover:border-border-strong'
              }`}
            >
              <Flex align="center" justify="center" gap="xs">
                <Icon size={14} />
                <Text size="sm">{label}</Text>
              </Flex>
            </Box>
          ))}
        </Flex>
        {mode === 'system' && (
          <Text size="xs" color="muted" className="mt-2 block">
            Following the OS — picking a theme below pins it as your preference for that side.
          </Text>
        )}
      </Box>

      <Divider />

      <ThemeGrid title="Dark themes" list={darkThemes} currentTheme={currentTheme} setTheme={setTheme} />
      <ThemeGrid title="Light themes" list={lightThemes} currentTheme={currentTheme} setTheme={setTheme} />

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

      <SettingRow
        label="Accent Color"
        description={
          appearance.accentColor
            ? 'Custom accent overriding the theme default'
            : 'Follows the theme — pick a colour to override'
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
              Use theme default
            </Button>
          )}
        </Flex>
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
