import { useEffect, type ReactNode } from 'react'
import { CynosureProvider, useTheme as useCynosureTheme } from '@arshad-shah/cynosure-react/theme'
import { useSettingsStore } from '@/stores/settings'
import { useThemesStore, type RegisteredThemeView } from '@/stores/themes'

/**
 * Glue between Verql theming and Cynosure.
 *
 * Verql's ThemeProvider stays the single source of truth for the active theme
 * (plugin registry, light/dark sides, validation) and keeps writing the theme
 * id to `<html data-theme>`. Cynosure only needs to know the *colour scheme*
 * (light vs dark) of whatever theme is active — for `color-scheme` on the
 * root (native scrollbars/controls), `useColorScheme()` consumers (charts),
 * and the CodeBlock light/dark highlight flip. That scheme is published on a
 * separate attribute so Cynosure never fights Verql for `data-theme`.
 *
 * All *colours* flow through CSS variables instead — see
 * `styles/cynosure-bridge.css`.
 */

/** Attribute Cynosure's ThemeProvider manages on `<html>`. Deliberately not
 *  `data-theme`: that belongs to Verql theme ids. */
export const CYNOSURE_SCHEME_ATTRIBUTE = 'data-cynosure-scheme' as const

/**
 * Resolve a Verql theme id to its colour scheme using the theme registry's
 * declared `type` — never name heuristics (a theme called "dracula" is dark
 * even though nothing in the name says so). Unknown ids fall back to dark,
 * matching the brand baseline (Nightshift).
 */
export function resolveCynosureScheme(
  themeId: string,
  themes: readonly Pick<RegisteredThemeView, 'id' | 'type'>[],
): 'light' | 'dark' {
  return themes.find((t) => t.id === themeId)?.type ?? 'dark'
}

/**
 * Keeps Cynosure's ThemeProvider in sync with the resolved Verql theme.
 * Mount once, anywhere inside both providers. Renders nothing.
 *
 * Reads `appearance.theme` from the settings store — Verql's ThemeProvider
 * mirrors the resolved theme id there (see ThemeProvider.tsx) — so this
 * component needs no extra context plumbing.
 */
export function CynosureSchemeSync(): null {
  const themeId = useSettingsStore((s) => s.settings.appearance.theme)
  const themes = useThemesStore((s) => s.themes)
  const { setTheme } = useCynosureTheme()

  const scheme = resolveCynosureScheme(themeId, themes)

  useEffect(() => {
    setTheme(scheme)
  }, [scheme, setTheme])

  return null
}

/**
 * Cynosure root provider configured for Verql. Mount once directly inside
 * Verql's ThemeProvider; composes Cynosure's theme/direction/locale/tooltip
 * contexts plus the scheme sync above.
 *
 * - `storage: null` — Verql settings are the persistence layer, not
 *   localStorage; the scheme is always derived from the active Verql theme.
 * - `enableSystem: false` — Verql's ThemeProvider already resolves `system`
 *   appearance mode against the OS preference; Cynosure just mirrors the
 *   outcome.
 */
export function CynosureAppProvider({ children }: { children: ReactNode }) {
  return (
    <CynosureProvider
      theme={{
        attribute: CYNOSURE_SCHEME_ATTRIBUTE,
        themes: ['light', 'dark'],
        defaultTheme: 'dark',
        storage: null,
        enableSystem: false,
        disableTransitionOnChange: true,
      }}
    >
      <CynosureSchemeSync />
      {children}
    </CynosureProvider>
  )
}
