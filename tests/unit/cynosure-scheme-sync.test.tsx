// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider as CynosureThemeProvider } from '@arshad-shah/cynosure-react/theme'
import {
  CYNOSURE_SCHEME_ATTRIBUTE,
  CynosureSchemeSync,
  resolveCynosureScheme,
} from '@/primitives/theme/cynosure'
import { useSettingsStore } from '@/stores/settings'
import { useThemesStore, type RegisteredThemeView } from '@/stores/themes'

const THEMES: RegisteredThemeView[] = [
  { id: 'nightshift', name: 'Nightshift', type: 'dark' },
  { id: 'lab', name: 'Lab', type: 'light' },
  { id: 'dracula', name: 'Dracula', type: 'dark' },
]

function setActiveTheme(id: string): void {
  useSettingsStore.setState((s) => ({
    settings: { ...s.settings, appearance: { ...s.settings.appearance, theme: id } },
  }))
}

describe('resolveCynosureScheme', () => {
  it('maps a registered theme to its registry type', () => {
    expect(resolveCynosureScheme('lab', THEMES)).toBe('light')
    expect(resolveCynosureScheme('nightshift', THEMES)).toBe('dark')
    // Name heuristics must NOT be involved: dracula has no dark-ish name.
    expect(resolveCynosureScheme('dracula', THEMES)).toBe('dark')
  })

  it('falls back to dark for unknown ids (brand default is dark)', () => {
    expect(resolveCynosureScheme('not-installed', THEMES)).toBe('dark')
    expect(resolveCynosureScheme('anything', [])).toBe('dark')
  })
})

describe('CynosureSchemeSync', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute(CYNOSURE_SCHEME_ATTRIBUTE)
    useThemesStore.setState({ themes: THEMES, loaded: true })
  })

  function mount() {
    return render(
      <CynosureThemeProvider
        attribute={CYNOSURE_SCHEME_ATTRIBUTE}
        themes={['light', 'dark']}
        defaultTheme="dark"
        storage={null}
        enableSystem={false}
      >
        <CynosureSchemeSync />
      </CynosureThemeProvider>,
    )
  }

  it('publishes the active theme type on the html element', async () => {
    setActiveTheme('lab')
    mount()
    await waitFor(() =>
      expect(document.documentElement.getAttribute(CYNOSURE_SCHEME_ATTRIBUTE)).toBe('light'),
    )
  })

  it('tracks theme changes, using the registry type — not the theme name', async () => {
    setActiveTheme('lab')
    mount()
    await waitFor(() =>
      expect(document.documentElement.getAttribute(CYNOSURE_SCHEME_ATTRIBUTE)).toBe('light'),
    )
    setActiveTheme('dracula')
    await waitFor(() =>
      expect(document.documentElement.getAttribute(CYNOSURE_SCHEME_ATTRIBUTE)).toBe('dark'),
    )
  })
})
