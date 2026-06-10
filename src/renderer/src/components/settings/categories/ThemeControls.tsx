import { Check, Sun, Moon, Monitor, AlertTriangle } from 'lucide-react'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Grid } from '@arshad-shah/cynosure-react/grid'
import { Text } from '@arshad-shah/cynosure-react/text'
import { Divider } from '@arshad-shah/cynosure-react/divider'
import { ThemeToggle } from '@arshad-shah/cynosure-react/theme-toggle'
import { useTheme } from '@/primitives'
import { useThemesStore } from '@/stores/themes'
import { useTranslation } from '@/i18n/I18nProvider'
import { SettingLabel } from '@/components/settings/SettingLabel'
import { SettingRow } from '../SettingRow'
import { isThemeSelectable } from './theme-utils'

/**
 * The theme controls of the Appearance settings — the light/dark/system mode
 * selector and the dark/light theme-picker grids.
 *
 * First Cynosure-migrated UI: it renders exclusively through Cynosure layout
 * primitives styled by props, so the active Verql theme recolours it via the
 * `--cynosure-*` bridge (styles/cynosure-bridge.css). The rest of
 * AppearanceSettings stays on the legacy `@/primitives` surface until its own
 * migration pass — both design systems coexist by design.
 */

const FALLBACK_PREVIEW = { bg: '#0B0F16', sidebar: '#131825', text: '#E8ECF3', accent: '#2bd9a3' }

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
  const { t: tr } = useTranslation()
  if (list.length === 0) return null
  return (
    <Box>
      <SettingLabel label={title} description="" />
      <Grid columns={4} gap="2">
        {list.map((t) => {
          const preview = t.preview ?? FALLBACK_PREVIEW
          const v = t.validation
          const selectable = isThemeSelectable(t)
          const hasError = !selectable
          const hasWarning = selectable && v && v.missingRecommended.length > 0
          const tooltip = hasError
            ? tr('settings.appearance.themeMissingRequired', { tokens: v!.missingRequired.join(', ') })
            : hasWarning
              ? tr('settings.appearance.themeMissingRecommended', { tokens: v!.missingRecommended.join(', ') })
              : undefined
          return (
            <Box
              key={t.id}
              as="button"
              type="button"
              onClick={() => { if (selectable) setTheme(t.id) }}
              aria-disabled={!selectable}
              disabled={!selectable}
              position="relative"
              borderRadius="lg"
              borderWidth="2"
              borderStyle="solid"
              opacity={!selectable ? 0.5 : undefined}
              borderColor={
                !selectable
                  ? undefined
                  : currentTheme === t.id
                    ? 'accent.solid'
                    : 'border.subtle'
              }
              style={{
                padding: '10px',
                background: preview.bg,
                cursor: !selectable ? 'not-allowed' : 'pointer',
                borderColor: !selectable ? 'color-mix(in srgb, var(--color-error) 40%, transparent)' : undefined,
              }}
              title={tooltip}
            >
              {(hasError || hasWarning) && (
                <Box
                  as="span"
                  position="absolute"
                  top="1.5"
                  right="1.5"
                  display="inline-flex"
                  borderRadius="full"
                  padding="0.5"
                  aria-label={tooltip}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hasError ? 'var(--color-error)' : 'var(--color-warning)',
                    color: hasError ? 'white' : 'rgba(0,0,0,0.8)',
                  }}
                >
                  <AlertTriangle size={9} />
                </Box>
              )}
              <Flex gap="1" marginBottom="2" height="1.5">
                <Box flex="1" borderRadius="sm" style={{ background: preview.sidebar }} />
                <Box
                  borderRadius="sm"
                  style={{ flex: 2, background: preview.bg, border: `1px solid ${preview.sidebar}` }}
                />
              </Flex>
              <Flex gap="1" marginBottom="1.5">
                <Box height="0.5" width="3" borderRadius="sm" style={{ background: preview.text }} />
                <Box height="0.5" width="5" borderRadius="sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Flex gap="1">
                <Box height="0.5" width="2" borderRadius="sm" style={{ background: preview.accent }} />
                <Box height="0.5" width="4" borderRadius="sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Text size="xs" align="center" as="div" marginTop="2" style={{ color: preview.text }}>
                {t.name} {currentTheme === t.id && <Check size={10} style={{ display: 'inline', marginLeft: '2px' }} />}
              </Text>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

export function ThemeControls() {
  const { t } = useTranslation()
  const { theme: currentTheme, setTheme } = useTheme()
  const themes = useThemesStore((s) => s.themes)

  // Split theme list by type so the picker groups dark + light. Picking
  // a theme also pins it as the preference for its side, so flipping
  // mode later still lands on the user's preferred theme for that mode.
  const darkThemes = themes.filter((t) => t.type === 'dark')
  const lightThemes = themes.filter((t) => t.type === 'light')

  return (
    <>
      {/* Cynosure ThemeToggle, right-aligned in a SettingRow like the other
          appearance controls. It drives Cynosure's theme context; the
          CynosureModeBridge mirrors that to/from Verql's persisted
          appearance.appearanceMode (see primitives/theme/cynosure.tsx). */}
      <SettingRow
        label={t('settings.appearance.colorMode.label')}
        description={t('settings.appearance.colorMode.description')}
      >
        <ThemeToggle
          variant="segmented"
          size="sm"
          showLabels
          modes={['light', 'dark', 'system']}
          label={t('settings.appearance.colorMode.label')}
          labels={{
            light: t('settings.appearance.mode.light'),
            dark: t('settings.appearance.mode.dark'),
            system: t('settings.appearance.mode.system'),
          }}
          icons={{
            light: <Sun size={14} />,
            dark: <Moon size={14} />,
            system: <Monitor size={14} />,
          }}
        />
      </SettingRow>

      <Divider />

      <ThemeGrid title={t('settings.appearance.darkThemes')} list={darkThemes} currentTheme={currentTheme} setTheme={setTheme} />
      <ThemeGrid title={t('settings.appearance.lightThemes')} list={lightThemes} currentTheme={currentTheme} setTheme={setTheme} />
    </>
  )
}
