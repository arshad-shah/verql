import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { ThemeProvider } from './primitives/theme/ThemeProvider'
import { App } from './App'
import { useSettingsStore, initSettingsListener } from '@/stores/settings'
import './styles/globals.css'
import { IPC_CHANNELS } from '@shared/ipc'

function AppLoader() {
  const hydrate = useSettingsStore((s) => s.hydrate)
  const loaded = useSettingsStore((s) => s.loaded)
  const editorFontFamily = useSettingsStore((s) => s.settings.editor.fontFamily)

  // Push the user's editor font onto the root `--app-font-mono` variable so
  // every `font-mono` surface (inspector, result grid, code chips, …) reflects
  // the Settings → Editor choice instead of the Tailwind default mono stack.
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-mono', editorFontFamily)
  }, [editorFontFamily])

  useEffect(() => {
    async function init() {
      // One-time migration from localStorage to settings store
      const oldTheme = localStorage.getItem('nova-theme')
      const oldSidebarWidth = localStorage.getItem('nova-sidebar-width')
      const oldSplitRatio = localStorage.getItem('nova-split-ratio')

      if (oldTheme || oldSidebarWidth || oldSplitRatio) {
        if (oldTheme) {
          await window.electronAPI.invoke(IPC_CHANNELS.SETTINGS_SET, 'appearance.theme', oldTheme)
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
        localStorage.removeItem('nova-theme')
        localStorage.removeItem('nova-sidebar-width')
        localStorage.removeItem('nova-split-ratio')
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
