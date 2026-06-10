import { useEffect, type ReactNode } from 'react'
import { CynosureProvider, useTheme as useCynosureTheme } from '@arshad-shah/cynosure-react/theme'
import { useSettingsStore } from '@/stores/settings'
import type { AppearanceMode } from '@shared/settings'

/**
 * Glue between Verql theming and Cynosure.
 *
 * Verql's settings store (`appearance.appearanceMode`) stays the single
 * *persisted* source of truth (saved via IPC). Cynosure's ThemeProvider holds
 * the same `light | dark | system` mode in memory (`storage: null`) so that
 * Cynosure's `<ThemeToggle>` — which reads and writes Cynosure's own theme
 * context — can drive the app theme. {@link CynosureModeBridge} keeps the two
 * in sync.
 *
 * Verql keeps owning `<html data-theme>` (theme ids: nightshift, lab, …);
 * Cynosure owns `data-cynosure-scheme` (resolved `light`/`dark`) for the things
 * that genuinely need the colour scheme — native scrollbars, charts, and the
 * CodeBlock highlight flip. All *colours* flow through the `--cynosure-*`
 * aliases in `styles/cynosure-bridge.css`.
 */

/** Attribute Cynosure's ThemeProvider manages on `<html>`. Deliberately not
 *  `data-theme`: that belongs to Verql theme ids. */
export const CYNOSURE_SCHEME_ATTRIBUTE = 'data-cynosure-scheme' as const

/**
 * Two-way mirror between Verql's appearance mode and Cynosure's theme context.
 *
 *   - user flips the `<ThemeToggle>` → Cynosure mode changes → write to Verql
 *   - user picks a theme in the grid / settings change elsewhere → Verql mode
 *     changes → push into Cynosure
 *
 * Both writes are guarded on inequality, so the two converge and never loop.
 * With `enableSystem`, Cynosure resolves `system` against the OS and writes the
 * resolved `light`/`dark` to `data-cynosure-scheme` for the bridge CSS.
 *
 * Mount once, anywhere inside both providers. Renders nothing.
 */
function CynosureModeBridge(): null {
  const verqlMode = useSettingsStore((s) => s.settings.appearance.appearanceMode)
  const setSetting = useSettingsStore((s) => s.set)
  const { theme: cynMode, setTheme: setCynMode } = useCynosureTheme()

  // Cynosure → Verql: a ThemeToggle flip changes Cynosure's mode; persist it as
  // the appearance preference (the only writer that leads here is the toggle —
  // Verql is seeded from its own store, so a lead means a user action).
  useEffect(() => {
    if (cynMode && cynMode !== verqlMode) {
      setSetting('appearance.appearanceMode', cynMode as AppearanceMode)
    }
    // Intentionally keyed on cynMode only: this effect reacts to Cynosure-led
    // changes. verqlMode is read for the guard but must not re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cynMode])

  // Verql → Cynosure: a theme-grid pick or external settings change moves the
  // mode; mirror it so the toggle and the scheme attribute stay in sync.
  useEffect(() => {
    if (verqlMode && verqlMode !== cynMode) setCynMode(verqlMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verqlMode])

  return null
}

/**
 * Cynosure root provider configured for Verql. Mount once directly inside
 * Verql's ThemeProvider; composes Cynosure's theme/direction/locale/tooltip
 * contexts plus the mode bridge above.
 *
 * - `defaultTheme` is seeded from the persisted Verql mode so the first paint
 *   matches and the bridge has nothing to reconcile (no mount-time clobber).
 * - `storage: null` — Verql settings are the persistence layer, not
 *   localStorage; Cynosure's mode is always mirrored from/to Verql.
 * - `enableSystem: true` — Cynosure resolves `system` against the OS for the
 *   `data-cynosure-scheme` attribute (Verql resolves it independently for
 *   `data-theme`, and the two agree).
 */
export function CynosureAppProvider({ children }: { children: ReactNode }) {
  const initialMode = useSettingsStore.getState().settings.appearance.appearanceMode
  return (
    <CynosureProvider
      theme={{
        attribute: CYNOSURE_SCHEME_ATTRIBUTE,
        themes: ['light', 'dark'],
        defaultTheme: initialMode,
        storage: null,
        enableSystem: true,
        disableTransitionOnChange: true,
      }}
    >
      <CynosureModeBridge />
      {children}
    </CynosureProvider>
  )
}
