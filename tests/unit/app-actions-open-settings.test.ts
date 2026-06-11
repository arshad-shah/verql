// Regression: the `open-settings` app-action (used by the AI and deep-link
// chips) opened the left *sidebar* panel (setActivePanel('settings')) instead
// of the dedicated Settings *tab* in the editor area. It now opens the
// SettingsTab via the tabs store, on the requested category.
import { describe, it, expect, beforeEach } from 'vitest'
import { registerBuiltinAppActions } from '../../src/renderer/src/lib/app-actions/builtins'
import { appActions } from '../../src/renderer/src/lib/app-actions/registry'
import { APP_ACTION } from '../../src/renderer/src/lib/app-actions/ids'
import { useUiStore } from '../../src/renderer/src/stores/ui'
import { useTabsStore } from '../../src/renderer/src/stores/tabs'

beforeEach(() => {
  // Fresh registry + stores per test.
  for (const a of appActions.list()) appActions.unregister?.(a.id)
  registerBuiltinAppActions()
  useUiStore.setState({ activePanel: 'explorer' })
  useTabsStore.setState({ tabs: [], activeTabId: null })
})

describe('open-settings app-action', () => {
  it('opens the Settings tab (not the sidebar panel), on the requested category', async () => {
    await appActions.run(APP_ACTION.OPEN_SETTINGS, { category: 'ai' })

    const tabs = useTabsStore.getState()
    expect(tabs.tabs.some((t) => t.type === 'settings')).toBe(true)
    expect(tabs.activeTabId).toBe('settings')
    expect(useUiStore.getState().activeSettingsCategory).toBe('ai')
    // The bug: it used to flip the left activity panel to 'settings'.
    expect(useUiStore.getState().activePanel).toBe('explorer')
  })

  it('opens the Settings tab even without a category', async () => {
    await appActions.run(APP_ACTION.OPEN_SETTINGS, {})
    expect(useTabsStore.getState().activeTabId).toBe('settings')
    expect(useUiStore.getState().activePanel).toBe('explorer')
  })
})
