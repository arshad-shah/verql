import {
  FilePlus, Database, X, RotateCcw, Settings as SettingsIcon,
  Undo2, Redo2, Scissors, Copy, ClipboardPaste, TextSelect, Search,
  Command, Compass, Boxes, PanelLeft, PanelRight, PanelBottom, Maximize,
  RefreshCw, Wrench, Play, ListChecks, Save, Code2,
  BookOpen, Puzzle, Bug, Info, Sparkles, PartyPopper, type LucideIcon,
} from 'lucide-react'
import { getLatestReleaseNote } from '@/lib/release-notes'
import { IPC_CHANNELS } from '@shared/ipc'
import { KEYBINDING_ACTION, type KeybindingActionId } from '@shared/settings'
import { useTranslation } from '@/i18n/I18nProvider'
import { isMac } from '@/lib/platform'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore, ACTIVITY_PANEL } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { editorRegistry } from '@/stores/editor'
import { tabActions, requestCloseTab } from '@/stores/tab-actions'

const GUIDE_URL = 'https://verql.arshadshah.com/guide/'
const SDK_URL = 'https://verql.arshadshah.com/plugins/sdk/'
const ISSUES_URL = 'https://github.com/arshad-shah/verql/issues'

export type MenuItemDef =
  | {
      kind: 'item'
      label: string
      icon?: LucideIcon
      /** Shortcut hint shown as Kbd chips (literal accelerator, e.g. "Ctrl+S"). */
      accelerator?: string
      run: () => void
      /** Evaluated when the menu opens; falsy hides the item's interactivity. */
      enabled?: () => boolean
      danger?: boolean
    }
  | { kind: 'separator' }

export interface MenuDef {
  label: string
  items: MenuItemDef[]
}

/* ── action helpers (read live store state at call time) ───────────────────── */

/** Live accelerator for a rebindable action, platform-filtered, so the hint
 *  always reflects Settings → Keybindings. */
function accel(actionId: KeybindingActionId): string | undefined {
  const kb = useSettingsStore.getState().settings.keybindings.find((k) => k.id === actionId)
  if (!kb) return undefined
  return kb.keys.find((k) => (isMac ? k.startsWith('Cmd') : k.startsWith('Ctrl'))) ?? kb.keys[0]
}

function newQuery(): void {
  const { activeConnectionId, connections } = useConnectionsStore.getState()
  const profile = connections.find((c) => c.id === activeConnectionId) ?? null
  useTabsStore.getState().addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(profile) })
}

function editRole(role: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll'): void {
  void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_EDIT_ROLE, role)
}

function openExternal(url: string): void {
  void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_OPEN_EXTERNAL, url)
}

const hasEditor = (): boolean => editorRegistry.get() !== null
const hasActiveTab = (): boolean => useTabsStore.getState().activeTabId !== null

/* ── the menu tree ─────────────────────────────────────────────────────────── */

/**
 * Declarative File / Edit / View / Query / Help tree for the app-designed menu
 * bar. Items reuse the same renderer actions as the keybindings, command
 * palette, and (where relevant) native edit roles, so behaviour stays identical
 * however the user invokes them. Trimmed to options that actually help in this
 * app — OS-only items (Window/minimise/zoom, Services/Hide) live in the window
 * controls or are dropped.
 */
export function useMenus(): MenuDef[] {
  const { t } = useTranslation()
  // Subscribe so a rebind in Settings re-renders the bar (accel() reads getState).
  useSettingsStore((s) => s.settings.keybindings)
  const isDev = import.meta.env.DEV

  const file: MenuDef = {
    label: t('menu.file'),
    items: [
      { kind: 'item', label: t('menu.newQueryTab'), icon: FilePlus, accelerator: accel(KEYBINDING_ACTION.NEW_TAB), run: newQuery },
      { kind: 'item', label: t('menu.newConnection'), icon: Database, accelerator: 'Ctrl+Shift+N', run: () => useTabsStore.getState().openConnectionForm() },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.closeTab'), icon: X, accelerator: accel(KEYBINDING_ACTION.CLOSE_TAB), enabled: hasActiveTab, run: () => {
        const id = useTabsStore.getState().activeTabId
        if (id) requestCloseTab(id, useTabsStore.getState().closeTab)
      } },
      { kind: 'item', label: t('menu.reopenTab'), icon: RotateCcw, accelerator: 'Ctrl+Shift+T', run: () => useTabsStore.getState().reopenTab() },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.settings'), icon: SettingsIcon, run: () => useTabsStore.getState().openSettings() },
    ],
  }

  const edit: MenuDef = {
    label: t('menu.edit'),
    items: [
      { kind: 'item', label: t('menu.undo'), icon: Undo2, run: () => editRole('undo') },
      { kind: 'item', label: t('menu.redo'), icon: Redo2, run: () => editRole('redo') },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.cut'), icon: Scissors, run: () => editRole('cut') },
      { kind: 'item', label: t('menu.copy'), icon: Copy, run: () => editRole('copy') },
      { kind: 'item', label: t('menu.paste'), icon: ClipboardPaste, run: () => editRole('paste') },
      { kind: 'item', label: t('menu.selectAll'), icon: TextSelect, run: () => editRole('selectAll') },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.find'), icon: Search, accelerator: 'Ctrl+F', enabled: hasEditor, run: () => editorRegistry.runAction('actions.find') },
    ],
  }

  const view: MenuDef = {
    label: t('menu.view'),
    items: [
      { kind: 'item', label: t('menu.commandPalette'), icon: Command, accelerator: accel(KEYBINDING_ACTION.COMMAND_PALETTE), run: () => useUiStore.getState().toggleCommandPalette() },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.showExplorer'), icon: Compass, run: () => useUiStore.getState().setActivePanel(ACTIVITY_PANEL.EXPLORER) },
      { kind: 'item', label: t('menu.showPlugins'), icon: Boxes, run: () => useUiStore.getState().setActivePanel(ACTIVITY_PANEL.PLUGINS) },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.toggleSidebar'), icon: PanelLeft, accelerator: accel(KEYBINDING_ACTION.TOGGLE_SIDEBAR), run: () => useUiStore.getState().toggleSidebar() },
      { kind: 'item', label: t('menu.toggleSecondarySidebar'), icon: PanelRight, accelerator: accel(KEYBINDING_ACTION.TOGGLE_SECONDARY_SIDEBAR), run: () => useUiStore.getState().toggleSecondarySidebar() },
      { kind: 'item', label: t('menu.toggleBottomDock'), icon: PanelBottom, accelerator: accel(KEYBINDING_ACTION.TOGGLE_BOTTOM_DOCK), run: () => useUiStore.getState().toggleBottomDock() },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.toggleFullScreen'), icon: Maximize, run: () => void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_TOGGLE_FULLSCREEN) },
      ...(isDev
        ? ([
            { kind: 'separator' },
            { kind: 'item', label: t('menu.reload'), icon: RefreshCw, run: () => void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_RELOAD) },
            { kind: 'item', label: t('menu.toggleDevTools'), icon: Wrench, run: () => void window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_TOGGLE_DEVTOOLS) },
          ] as MenuItemDef[])
        : []),
    ],
  }

  const query: MenuDef = {
    label: t('menu.query'),
    items: [
      { kind: 'item', label: t('menu.run'), icon: Play, accelerator: accel(KEYBINDING_ACTION.EXECUTE_QUERY), enabled: hasEditor, run: () => editorRegistry.runAction('execute-query') },
      { kind: 'item', label: t('menu.runSelection'), icon: ListChecks, enabled: () => editorRegistry.getSelectedSql() !== '', run: () => {
        const reg = editorRegistry.get()
        const sql = editorRegistry.getSelectedSql()
        if (reg && sql) tabActions.runStatement(reg.tabId, sql)
      } },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.save'), icon: Save, accelerator: accel(KEYBINDING_ACTION.SAVE_QUERY), enabled: hasActiveTab, run: () => {
        const id = useTabsStore.getState().activeTabId
        if (id) void tabActions.save(id)
      } },
      { kind: 'item', label: t('menu.formatSql'), icon: Code2, accelerator: 'Shift+Alt+F', enabled: hasEditor, run: () => editorRegistry.runAction('editor.action.formatDocument') },
    ],
  }

  const latestRelease = getLatestReleaseNote()
  const help: MenuDef = {
    label: t('menu.help'),
    items: [
      { kind: 'item', label: t('menu.welcome'), icon: Sparkles, run: () => useTabsStore.getState().openWelcome() },
      {
        kind: 'item',
        label: t('menu.whatsNew'),
        icon: PartyPopper,
        enabled: () => !!latestRelease,
        run: () => { if (latestRelease) useTabsStore.getState().openReleaseNotes(latestRelease.version) },
      },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.userGuideShort'), icon: BookOpen, run: () => openExternal(GUIDE_URL) },
      { kind: 'item', label: t('menu.buildPlugin'), icon: Puzzle, run: () => openExternal(SDK_URL) },
      { kind: 'item', label: t('menu.reportIssue'), icon: Bug, run: () => openExternal(ISSUES_URL) },
      { kind: 'separator' },
      { kind: 'item', label: t('menu.aboutShort'), icon: Info, run: () => useUiStore.getState().setAboutModalOpen(true) },
    ],
  }

  return [file, edit, view, query, help]
}
