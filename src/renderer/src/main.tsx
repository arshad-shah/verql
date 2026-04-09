import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { ThemeProvider } from './primitives/theme/ThemeProvider'
import { App } from './App'
import { useSettingsStore, initSettingsListener } from '@/stores/settings'
import './styles/globals.css'

function AppLoader() {
  const hydrate = useSettingsStore((s) => s.hydrate)
  const loaded = useSettingsStore((s) => s.loaded)

  useEffect(() => {
    async function init() {
      // One-time migration from localStorage to settings store
      const oldTheme = localStorage.getItem('dbstudio-theme')
      const oldSidebarWidth = localStorage.getItem('dbstudio-sidebar-width')
      const oldSplitRatio = localStorage.getItem('dbstudio-split-ratio')

      if (oldTheme || oldSidebarWidth || oldSplitRatio) {
        if (oldTheme) {
          await window.electronAPI.invoke('settings:set', 'appearance.theme', oldTheme)
        }
        if (oldSidebarWidth) {
          await window.electronAPI.invoke(
            'settings:set',
            'appearance.sidebarWidth',
            parseFloat(oldSidebarWidth)
          )
        }
        if (oldSplitRatio) {
          await window.electronAPI.invoke(
            'settings:set',
            'appearance.splitRatio',
            parseFloat(oldSplitRatio)
          )
        }
        localStorage.removeItem('dbstudio-theme')
        localStorage.removeItem('dbstudio-sidebar-width')
        localStorage.removeItem('dbstudio-split-ratio')
      }

      await hydrate()
      initSettingsListener()
    }
    init()
  }, [hydrate])

  if (!loaded) return null

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppLoader />
    </ErrorBoundary>
  </StrictMode>
)
