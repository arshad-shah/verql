import { useState, useEffect } from 'react'
import { BottomDock, useHasBottomPanels } from '@/components/shell/BottomDock'
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/tab-bar'
import { ToastContainer } from '@/components/shell/ToastContainer'
import { QueryPanel } from '@/components/query/QueryPanel'
import { ERDiagram } from '@/components/er/ERDiagram'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import { Flex, Box, ResizeHandle, Modal, Button, Text, Stack } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
import { editorRegistry } from '@/stores/editor'
import { tabActions, requestCloseTab as routeCloseTab, usePendingClose } from '@/stores/tab-actions'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionsStore } from '@/stores/connections'
import { ConnectionFormView } from '@/components/connections/ConnectionFormView'
import { PluginDetailView } from '@/components/plugins/PluginDetailView'
import { InstallPluginTab } from '@/components/plugins/InstallPluginTab'
import { MCPApprovalDialog } from '@/components/ai/MCPApprovalDialog'
import { PluginRestartBanner } from '@/components/plugins/PluginRestartBanner'
import { SectionErrorBoundary } from '@/components/shell/SectionErrorBoundary'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { WelcomeScreen } from '@/components/shell/WelcomeScreen'
import { SecondarySidebar } from '@/components/shell/SecondarySidebar'
import { SecondaryActivityBar } from '@/components/shell/SecondaryActivityBar'
import type { QueryTab, ErDiagramTab, ConnectionFormTab, PluginDetailTab } from '@shared/types'
import { registerBuiltinStatementContributions } from '@/lib/statement-contributions'
import { registerBuiltinAppActions } from '@/lib/app-actions/builtins'
import { initAppActionBridge } from '@/lib/app-actions/bridge'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { usePanelResize } from '@/hooks/usePanelResize'
import { notifyError } from '@/lib/notify-error'

// Register CodeLens statement contributions once at module init. Re-registration
// is a no-op (the registry replaces by dbType), so HMR remains safe.
registerBuiltinStatementContributions()
// Register built-in app actions (deep-link / agentic action targets) once, and
// wire the main-process agentic action bridge to the renderer registry.
registerBuiltinAppActions()
initAppActionBridge()
import { IPC_EVENTS, IPC_CHANNELS } from '@shared/ipc'
import { KEYBINDING_ACTION } from '@shared/settings'
import { usePluginCommands } from '@/stores/plugin-commands'
import { matchesAccelerator } from '@/lib/accelerators'
import { useTranslation } from '@/i18n/I18nProvider'

export function App() {
  const { t } = useTranslation()
  // Subscribe per-field (not the whole store): App renders the entire shell, so
  // a whole-store subscription re-rendered it on every tab mutation — including
  // per-keystroke updateTabSql. Actions are stable refs, so selecting them
  // individually is free.
  const tabs = useTabsStore(s => s.tabs)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const closeTab = useTabsStore(s => s.closeTab)
  const reopenTab = useTabsStore(s => s.reopenTab)
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)
  const sidebarVisible = useUiStore(s => s.sidebarVisible)
  const setSidebarWidth = useUiStore(s => s.setSidebarWidth)
  const sidebarWidth = useSettingsStore(s => s.settings.appearance.sidebarWidth)
  const sidebarPosition = useSettingsStore(s => s.settings.appearance.sidebarPosition)
  const showStatusBar = useSettingsStore(s => s.settings.appearance.showStatusBar)
  const bottomDockHeight = useSettingsStore(s => s.settings.appearance.bottomDockHeight)
  const bottomDockVisible = useUiStore(s => s.bottomDockVisible)
  const setBottomDockHeight = useUiStore(s => s.setBottomDockHeight)
  const secondarySidebarWidth = useSettingsStore(s => s.settings.appearance.secondarySidebarWidth)
  const secondarySidebarVisible = useUiStore(s => s.secondarySidebarVisible)
  const setSecondarySidebarWidth = useUiStore(s => s.setSecondarySidebarWidth)
  const activeConnectionId = useConnectionsStore(s => s.activeConnectionId)
  const loadConnections = useConnectionsStore(s => s.loadConnections)

  // Bootstrap the connections store on first render. Previously the explorer's
  // top-of-tree dropdown owned this load via its own useEffect; when we
  // consolidated connection management into the secondary-sidebar panel and
  // deleted that component, the load lost its caller and the panel rendered
  // against an empty store. Doing it at the App level guarantees every
  // consumer (the panel, the status bar quick-switcher, the per-tab
  // ConnectionSelector) sees the saved profiles regardless of mount order.
  useEffect(() => {
    void loadConnections()
  }, [loadConnections])
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  const hasBottomPanels = useHasBottomPanels()
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Shared across every close site (tab-bar X, Cmd+W, context menu). The
  // store gives us a single pending tab id; setting it raises the dialog.
  const pendingCloseId = usePendingClose(s => s.pendingId)
  const clearPendingClose = usePendingClose(s => s.clear)
  // Local convenience wrapper — every Cmd+W / programmatic close in App.tsx
  // goes through this so dirty-check stays consistent with the tab-bar.
  const requestCloseTab = (tabId: string) => routeCloseTab(tabId, closeTab)

  // Keyboard shortcuts + native menu events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Built-in shortcuts are data-driven from the user's keybindings setting
      // (Settings → Keybindings), so a rebind there takes effect immediately.
      // `execute-query` is owned by the Monaco editor (it registers the binding
      // itself, also from this setting) and intentionally has no entry here.
      // Save dispatches to whichever tab is in front via tabActions so it works
      // for query, settings, and any future tab kind.
      const actions: Record<string, () => void> = {
        [KEYBINDING_ACTION.NEW_TAB]: () => {
          const activeProfile = useConnectionsStore.getState().connections.find(c => c.id === activeConnectionId) ?? null
          addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })
        },
        [KEYBINDING_ACTION.CLOSE_TAB]: () => { if (activeTabId) requestCloseTab(activeTabId) },
        [KEYBINDING_ACTION.COMMAND_PALETTE]: () => setPaletteOpen(prev => !prev),
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

    // File drop → plugin drag-drop providers. We forward the dropped file
    // paths to the main process which routes to the matching extension
    // handler (e.g. `.sqlite` → sqlite plugin opens it). The renderer stays
    // ignorant of which extensions are claimed; the registry decides.
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault()
      }
    }
    const handleDrop = (e: DragEvent) => {
      if (!e.dataTransfer) return
      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return
      e.preventDefault()
      for (const f of files) {
        const path = (f as File & { path?: string }).path
        if (!path) continue
        window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_DRAG_DROP, path).catch(() => {})
      }
    }
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    // Listen for native menu commands
    const cleanups = [
      window.electronAPI.on(IPC_EVENTS.MENU_NEW_QUERY_TAB, () => {
        const activeProfile = useConnectionsStore.getState().connections.find(c => c.id === activeConnectionId) ?? null
        addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })
      }),
      window.electronAPI.on(IPC_EVENTS.MENU_NEW_CONNECTION, () => openConnectionForm()),
      window.electronAPI.on(IPC_EVENTS.MENU_TOGGLE_COMMAND_PALETTE, () => setPaletteOpen(prev => !prev)),
    ]

    const handleStatusBarNewConn = () => openConnectionForm()
    window.addEventListener('statusbar:new-connection', handleStatusBarNewConn)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keydown', pluginKeydown)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('statusbar:new-connection', handleStatusBarNewConn)
      cleanups.forEach(cleanup => cleanup())
    }
  }, [activeConnectionId, activeTabId, addQueryTab, closeTab, reopenTab, openConnectionForm])

  // Panel resize behavior (draft-during-drag, commit-on-release, collapse on
  // double-click) is shared across the three handles via usePanelResize.
  const {
    effective: effectiveBottomHeight,
    onResize: handleBottomResize,
    onResizeEnd: handleBottomResizeEnd,
    onDoubleClick: handleBottomResizeDoubleClick,
  } = usePanelResize({
    value: bottomDockHeight, min: 120, max: 640, restoreDefault: 240, direction: -1,
    read: () => useSettingsStore.getState().settings.appearance.bottomDockHeight,
    commit: setBottomDockHeight,
  })

  const {
    effective: effectiveSecondaryWidth,
    onResize: handleSecondaryResize,
    onResizeEnd: handleSecondaryResizeEnd,
    onDoubleClick: handleSecondaryResizeDoubleClick,
  } = usePanelResize({
    value: secondarySidebarWidth, min: 220, max: 640, restoreDefault: 320, direction: -1,
    read: () => useSettingsStore.getState().settings.appearance.secondarySidebarWidth,
    commit: setSecondarySidebarWidth,
  })

  const {
    effective: effectiveSidebarWidth,
    onResize: handleSidebarResize,
    onResizeEnd: handleSidebarResizeEnd,
    onDoubleClick: handleSidebarResizeDoubleClick,
  } = usePanelResize({
    value: sidebarWidth, min: 180, max: 480, restoreDefault: 240, direction: 1,
    read: () => useSettingsStore.getState().settings.appearance.sidebarWidth,
    commit: setSidebarWidth,
  })

  return (
    <Flex direction="column" className="h-screen bg-bg-primary text-text-primary">
      <SectionErrorBoundary label={t('shell.sectionLabels.titleBar')}>
        <TitleBar />
      </SectionErrorBoundary>
      <Flex className="flex-1 overflow-hidden">
        <SectionErrorBoundary label={t('shell.sectionLabels.activityBar')}>
          <ActivityBar />
        </SectionErrorBoundary>
        {sidebarVisible && sidebarPosition === 'left' && (
          <>
            <Flex direction="column" style={{ width: effectiveSidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label={t('shell.sectionLabels.sidebar')}>
                <Sidebar />
              </SectionErrorBoundary>
            </Flex>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSidebarResize}
              onResizeEnd={handleSidebarResizeEnd}
              onDoubleClick={handleSidebarResizeDoubleClick}
            />
          </>
        )}
        <Flex direction="column" className="flex-1 overflow-hidden">
          { activeTab && <TabBar /> }
          <Flex direction="column" className="flex-1 overflow-hidden">
            <Box className="flex-1 overflow-hidden">
              <SectionErrorBoundary label={activeTab?.title ?? t('shell.sectionLabels.tab')} resetKey={activeTabId}>
                {activeTab?.type === 'query' && (
                  <QueryPanel tab={activeTab as QueryTab} />
                )}
                {activeTab?.type === 'er-diagram' && (
                  <ERDiagram
                    connectionId={(activeTab as ErDiagramTab).connectionId}
                    schema={(activeTab as ErDiagramTab).schema}
                  />
                )}
                {activeTab?.type === 'connection-form' && (
                  <ConnectionFormView
                    tabId={activeTab.id}
                    editingId={(activeTab as ConnectionFormTab).editingId}
                  />
                )}
                {activeTab?.type === 'plugin-detail' && (
                  <PluginDetailView
                    pluginName={(activeTab as PluginDetailTab).pluginName}
                  />
                )}
                {activeTab?.type === 'install-plugin' && (
                  <InstallPluginTab />
                )}
                {activeTab?.type === 'settings' && (
                  <SettingsLayout />
                )}
              </SectionErrorBoundary>
              {!activeTab && (
                <SectionErrorBoundary label={t('shell.sectionLabels.welcome')}>
                  <WelcomeScreen />
                </SectionErrorBoundary>
              )}
            </Box>
            {bottomDockVisible && hasBottomPanels && (
              <>
                <ResizeHandle
                  direction="vertical"
                  onResize={handleBottomResize}
                  onResizeEnd={handleBottomResizeEnd}
                  onDoubleClick={handleBottomResizeDoubleClick}
                />
                <Box style={{ height: effectiveBottomHeight }} className="shrink-0">
                  <SectionErrorBoundary label={t('shell.sectionLabels.bottomDock')}>
                    <BottomDock />
                  </SectionErrorBoundary>
                </Box>
              </>
            )}
          </Flex>
        </Flex>
        {sidebarVisible && sidebarPosition === 'right' && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSidebarResize}
              onResizeEnd={handleSidebarResizeEnd}
              onDoubleClick={handleSidebarResizeDoubleClick}
            />
            <Flex direction="column" style={{ width: effectiveSidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label={t('shell.sectionLabels.sidebar')}>
                <Sidebar />
              </SectionErrorBoundary>
            </Flex>
          </>
        )}
        {secondarySidebarVisible && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSecondaryResize}
              onResizeEnd={handleSecondaryResizeEnd}
              onDoubleClick={handleSecondaryResizeDoubleClick}
            />
            <Flex direction="column" style={{ width: effectiveSecondaryWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label={t('shell.sectionLabels.secondarySidebar')}>
                <SecondarySidebar />
              </SectionErrorBoundary>
            </Flex>
          </>
        )}
        <SectionErrorBoundary label={t('shell.sectionLabels.secondaryActivityBar')}>
          <SecondaryActivityBar />
        </SectionErrorBoundary>
      </Flex>
      {showStatusBar && (
        <SectionErrorBoundary label={t('shell.sectionLabels.statusBar')}>
          <StatusBar />
        </SectionErrorBoundary>
      )}
      <ToastContainer />
      <SectionErrorBoundary label={t('shell.sectionLabels.commandPalette')}>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </SectionErrorBoundary>
      <SectionErrorBoundary label={t('shell.sectionLabels.mcpApproval')}>
        <MCPApprovalDialog />
      </SectionErrorBoundary>
      <SectionErrorBoundary label={t('shell.sectionLabels.pluginRestartBanner')}>
        <PluginRestartBanner />
      </SectionErrorBoundary>
      {pendingCloseId !== null && tabActions.hasOpenTransaction(pendingCloseId) ? (
        // Transaction close-guard: user must Commit or Rollback before the tab closes.
        // Uses the same Modal/Button/Text/Stack/Flex primitives as ConfirmDialog.
        <Modal open onClose={clearPendingClose} className="w-[400px] max-w-[90vw]">
          <Stack gap="md" className="p-4">
            <Text size="sm" weight="semibold">{t('shell.confirmTransaction.title')}</Text>
            <Text size="sm" color="secondary">
              {t('shell.confirmTransaction.message', {
                label: tabActions.get(pendingCloseId)?.label ?? t('shell.confirmTransaction.thisTab'),
              })}
            </Text>
          </Stack>
          <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={clearPendingClose}>{t('common.cancel')}</Button>
            <Button
              variant="error"
              size="sm"
              onClick={async () => {
                const id = pendingCloseId
                if (!id) return
                try {
                  await tabActions.rollbackTransaction(id)
                  clearPendingClose()
                  closeTab(id)
                } catch (err) {
                  notifyError(err, {
                    source: { type: 'tab', id, label: tabActions.get(id)?.label ?? id },
                  })
                  // leave dialog open so the user can retry or cancel
                }
              }}
            >
              {t('shell.confirmTransaction.rollbackAndClose')}
            </Button>
            <Button
              variant="solid"
              size="sm"
              onClick={async () => {
                const id = pendingCloseId
                if (!id) return
                try {
                  await tabActions.commitTransaction(id)
                  clearPendingClose()
                  closeTab(id)
                } catch (err) {
                  notifyError(err, {
                    source: { type: 'tab', id, label: tabActions.get(id)?.label ?? id },
                  })
                  // leave dialog open so the user can retry or cancel
                }
              }}
            >
              {t('shell.confirmTransaction.commitAndClose')}
            </Button>
          </Flex>
        </Modal>
      ) : (
        <ConfirmDialog
          open={pendingCloseId !== null}
          title={t('shell.confirmClose.unsavedTitle')}
          message={(() => {
            if (!pendingCloseId) return ''
            const label = tabActions.get(pendingCloseId)?.label ?? t('shell.confirmClose.thisTab')
            return t('shell.confirmClose.unsavedMessage', { label })
          })()}
          confirmLabel={t('shell.confirmClose.discardChanges')}
          cancelLabel={t('shell.confirmClose.keepEditing')}
          variant="danger"
          onCancel={clearPendingClose}
          onConfirm={() => {
            const id = pendingCloseId
            clearPendingClose()
            if (id) closeTab(id)
          }}
        />
      )}
    </Flex>
  )
}
