import { useEffect } from 'react'
import { editorRegistry } from '@/stores/editor'
import { tabActions, requestCloseTab as routeCloseTab } from '@/stores/tab-actions'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { getProfile } from '@/stores/connections'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { KEYBINDING_ACTION } from '@shared/settings'
import { usePluginCommands } from '@/stores/plugin-commands'
import { matchesAccelerator } from '@/lib/accelerators'
import type { useTabsStore } from '@/stores/tabs'

type AddQueryTab = ReturnType<typeof useTabsStore.getState>['addQueryTab']
type CloseTab = ReturnType<typeof useTabsStore.getState>['closeTab']

interface Options {
  activeConnectionId: string | null
  activeTabId: string | null
  addQueryTab: AddQueryTab
  closeTab: CloseTab
  reopenTab: () => void
}

/** Wires the app's global keyboard shortcuts: the data-driven built-in
 *  bindings (Settings → Keybindings), plugin-contributed command accelerators,
 *  and the fixed reopen-closed-tab chord. */
export function useAppKeyboardShortcuts({ activeConnectionId, activeTabId, addQueryTab, closeTab, reopenTab }: Options): void {
  useEffect(() => {
    const requestCloseTab = (tabId: string) => routeCloseTab(tabId, closeTab)

    const handleKeyDown = (e: KeyboardEvent) => {
      // Built-in shortcuts are data-driven from the user's keybindings setting
      // (Settings → Keybindings), so a rebind there takes effect immediately.
      // `execute-query` is owned by the Monaco editor (it registers the binding
      // itself, also from this setting) and intentionally has no entry here.
      // Save dispatches to whichever tab is in front via tabActions so it works
      // for query, settings, and any future tab kind.
      const actions: Record<string, () => void> = {
        [KEYBINDING_ACTION.NEW_TAB]: () => {
          const activeProfile = getProfile(activeConnectionId)
          addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })
        },
        [KEYBINDING_ACTION.CLOSE_TAB]: () => { if (activeTabId) requestCloseTab(activeTabId) },
        [KEYBINDING_ACTION.COMMAND_PALETTE]: () => useUiStore.getState().toggleCommandPalette(),
        [KEYBINDING_ACTION.SAVE_QUERY]: () => { if (activeTabId) void tabActions.save(activeTabId) },
        [KEYBINDING_ACTION.TOGGLE_SIDEBAR]: () => useUiStore.getState().toggleSidebar(),
        [KEYBINDING_ACTION.FOCUS_EDITOR]: () => editorRegistry.get()?.editor.focus(),
        [KEYBINDING_ACTION.TOGGLE_SECONDARY_SIDEBAR]: () => useUiStore.getState().toggleSecondarySidebar(),
        [KEYBINDING_ACTION.TOGGLE_BOTTOM_DOCK]: () => useUiStore.getState().toggleBottomDock(),
      }
      const keybindings = useSettingsStore.getState().settings.keybindings
      for (const kb of keybindings) {
        const handler = actions[kb.id]
        if (!handler) continue
        if (kb.keys.some(k => matchesAccelerator(e, k))) {
          e.preventDefault()
          handler()
          return
        }
      }
      // Reopen-closed-tab isn't a user-configurable binding; keep it fixed.
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        reopenTab()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Plugin keybindings: any command contributed with a `keybinding` field
    // becomes a global accelerator. We parse the binding string once per
    // command and dispatch through the same IPC path the command palette uses
    // (`plugins:ui:action`) so behaviour stays identical whether the user
    // pressed the key or clicked the palette entry.
    const pluginKeydown = (e: KeyboardEvent) => {
      const { commands, execute } = usePluginCommands.getState()
      for (const cmd of commands) {
        if (!cmd.keybinding) continue
        if (matchesAccelerator(e, cmd.keybinding)) {
          e.preventDefault()
          execute(cmd.pluginId, cmd.commandId).catch(() => {})
          return
        }
      }
    }
    window.addEventListener('keydown', pluginKeydown)
    usePluginCommands.getState().fetch()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keydown', pluginKeydown)
    }
  }, [activeConnectionId, activeTabId, addQueryTab, closeTab, reopenTab])
}
