import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/shell/ErrorBoundary'
import { ThemeProvider } from './primitives/theme/ThemeProvider'
import { SplashScreen } from './components/shell/SplashScreen'
import { App } from './App'
import { useSettingsStore, initSettingsListener } from '@/stores/settings'
import { useAIStore } from '@/stores/ai'
import { hydrateSavedQueries } from '@/components/saved-queries/SavedQueriesPanel'
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
      const oldTheme = localStorage.getItem('verql-theme')
      const oldSidebarWidth = localStorage.getItem('verql-sidebar-width')

      if (oldTheme || oldSidebarWidth) {
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
        localStorage.removeItem('verql-theme')
        localStorage.removeItem('verql-sidebar-width')
        // Legacy split-ratio key is no longer used; clear it if present.
        localStorage.removeItem('verql-split-ratio')
      }

      await hydrate()
      initSettingsListener()
      // Load app-data-store–backed state (AI conversations, saved queries),
      // migrating any legacy localStorage payload on first run. Non-blocking
      // for first paint — these populate the AI panel and saved-queries list.
      void useAIStore.getState().hydrate()
      void hydrateSavedQueries()
    }
    init()
  }, [hydrate])

  if (!loaded) {
    return (
      <ThemeProvider>
        <SplashScreen />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

/**
 * Tear down the pre-React splash (rendered statically in index.html) once
 * React has mounted. A short fade keeps the handoff smooth — the React-side
 * <SplashScreen> picks up immediately while settings hydrate.
 */
function dismissBootSplash() {
  const el = document.getElementById('boot-splash')
  if (!el) return
  el.classList.add('boot-splash--leaving')
  // Wait out the CSS transition before removal so we don't flash through.
  window.setTimeout(() => el.remove(), 300)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppLoader />
    </ErrorBoundary>
  </StrictMode>
)

// React has rendered (or at least scheduled) — fade out the static splash that
// covers the gap between window-shown and bundle-evaluated. Use rAF so the
// removal happens after the first React commit, not before it.
requestAnimationFrame(() => requestAnimationFrame(dismissBootSplash))
