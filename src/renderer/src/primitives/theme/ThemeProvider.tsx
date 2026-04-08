import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'dbstudio-theme'
const AVAILABLE_THEMES = ['dark', 'light', 'midnight'] as const

type Theme = (typeof AVAILABLE_THEMES)[number]

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && AVAILABLE_THEMES.includes(stored as Theme)) {
    return stored as Theme
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      setThemeState(newTheme)
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
