import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings'
import { AVAILABLE_THEMES, type Theme } from '@shared/settings'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.settings.appearance.theme)
  const uiDensity = useSettingsStore((s) => s.settings.appearance.uiDensity)
  const accentColor = useSettingsStore((s) => s.settings.appearance.accentColor)
  const animations = useSettingsStore((s) => s.settings.appearance.animations)
  const setSetting = useSettingsStore((s) => s.set)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', uiDensity)
  }, [uiDensity])

  useEffect(() => {
    document.documentElement.setAttribute('data-animations', animations ? 'on' : 'off')
  }, [animations])

  useEffect(() => {
    const root = document.documentElement
    // Empty / unset → don't override, let the active theme's accent win.
    if (accentColor && accentColor.trim() !== '') {
      root.style.setProperty('--color-accent', accentColor)
      // Derive hover (lighter) and muted (very transparent) variants
      root.style.setProperty('--color-accent-hover', `color-mix(in oklch, ${accentColor}, white 20%)`)
      root.style.setProperty('--color-accent-muted', `color-mix(in oklch, ${accentColor}, transparent 80%)`)
      root.style.setProperty('--color-focus-ring', accentColor)
    } else {
      root.style.removeProperty('--color-accent')
      root.style.removeProperty('--color-accent-hover')
      root.style.removeProperty('--color-accent-muted')
      root.style.removeProperty('--color-focus-ring')
    }
  }, [accentColor])

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      setSetting('appearance.theme', newTheme)
    }
  }

  return (
    <ThemeContext value={{ theme, setTheme, themes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
