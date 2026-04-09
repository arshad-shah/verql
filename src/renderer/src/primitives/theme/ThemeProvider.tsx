import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings'

const AVAILABLE_THEMES = ['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const
type Theme = (typeof AVAILABLE_THEMES)[number]

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.settings.appearance.theme)
  const setSetting = useSettingsStore((s) => s.set)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
