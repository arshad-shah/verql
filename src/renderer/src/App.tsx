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
import { Flex, Box, ResizeHandle } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
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
import { initialAutoCommit } from '@/lib/initial-autocommit'

// Register CodeLens statement contributions once at module init. Re-registration
// is a no-op (the registry replaces by dbType), so HMR remains safe.
registerBuiltinStatementContributions()
import { IPC_EVENTS, IPC_CHANNELS } from '@shared/ipc'
import { usePluginCommands } from '@/stores/plugin-commands'
import { matchesAccelerator } from '@/lib/accelerators'

export function App() {
  const { tabs, activeTabId, addQueryTab, closeTab, reopenTab } = useTabsStore()
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)
  const { sidebarVisible, setSidebarWidth } = useUiStore()
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
  const connections = useConnectionsStore(s => s.connections)
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
  const activeTab = tabs.find(t => t.id === activeTabId)
  const hasBottomPanels = useHasBottomPanels()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [prevSidebarWidth, setPrevSidebarWidth] = useState(sidebarWidth)
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
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
      if (mod && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) requestCloseTab(activeTabId)
      }
      // Global save: dispatches to whichever tab is in front. Settings, query,
      // any future tab kind — they all participate by registering with
      // tabActions. Capture phase + preventDefault keeps the browser's
      // default "Save Page As" dialog out of the way.
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (activeTabId) void tabActions.save(activeTabId)
      }
      if (mod && e.key === 't' && !e.shiftKey) {
        e.preventDefault()
        const activeProfile = useConnectionsStore.getState().connections.find(c => c.id === activeConnectionId) ?? null
        addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })
      }
      if (mod && e.shiftKey && e.key === 't') {
        e.preventDefault()
        reopenTab()
      }
      if (mod && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        useUiStore.getState().toggleSecondarySidebar()
      }
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        useUiStore.getState().toggleBottomDock()
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

  // Bottom dock resize — draft state prevents per-pixel settings writes during drag
  const [draftBottomHeight, setDraftBottomHeight] = useState<number | null>(null)
  const effectiveBottomHeight = draftBottomHeight ?? bottomDockHeight
  const [prevBottomDockHeight, setPrevBottomDockHeight] = useState(bottomDockHeight)

  const handleBottomResize = (delta: number) => {
    setDraftBottomHeight(prev => {
      const current = prev ?? useSettingsStore.getState().settings.appearance.bottomDockHeight
      return Math.min(640, Math.max(120, current - delta))
    })
  }
  const handleBottomResizeEnd = () => {
    if (draftBottomHeight !== null) {
      setBottomDockHeight(draftBottomHeight)
      setDraftBottomHeight(null)
    }
  }
  const handleBottomResizeDoubleClick = () => {
    const current = useSettingsStore.getState().settings.appearance.bottomDockHeight
    if (current > 120) {
      setPrevBottomDockHeight(current)
      setBottomDockHeight(120)
    } else {
      setBottomDockHeight(prevBottomDockHeight > 120 ? prevBottomDockHeight : 240)
    }
  }

  // Secondary sidebar resize — draft state prevents per-pixel settings writes during drag
  const [draftSecondaryWidth, setDraftSecondaryWidth] = useState<number | null>(null)
  const effectiveSecondaryWidth = draftSecondaryWidth ?? secondarySidebarWidth
  const [prevSecondaryWidth, setPrevSecondaryWidth] = useState(secondarySidebarWidth)

  const handleSecondaryResize = (delta: number) => {
    setDraftSecondaryWidth(prev => {
      const current = prev ?? useSettingsStore.getState().settings.appearance.secondarySidebarWidth
      return Math.min(640, Math.max(220, current - delta))
    })
  }
  const handleSecondaryResizeEnd = () => {
    if (draftSecondaryWidth !== null) {
      setSecondarySidebarWidth(draftSecondaryWidth)
      setDraftSecondaryWidth(null)
    }
  }
  const handleSecondaryResizeDoubleClick = () => {
    const current = useSettingsStore.getState().settings.appearance.secondarySidebarWidth
    if (current > 220) {
      setPrevSecondaryWidth(current)
      setSecondarySidebarWidth(220)
    } else {
      setSecondarySidebarWidth(prevSecondaryWidth > 220 ? prevSecondaryWidth : 320)
    }
  }

  // Left sidebar resize — draft state prevents per-pixel settings writes during drag
  const [draftSidebarWidth, setDraftSidebarWidth] = useState<number | null>(null)
  const effectiveSidebarWidth = draftSidebarWidth ?? sidebarWidth

  const handleSidebarResize = (delta: number) => {
    setDraftSidebarWidth(prev => {
      const current = prev ?? useSettingsStore.getState().settings.appearance.sidebarWidth
      return Math.min(480, Math.max(180, current + delta))
    })
  }
  const handleSidebarResizeEnd = () => {
    if (draftSidebarWidth !== null) {
      setSidebarWidth(draftSidebarWidth)
      setDraftSidebarWidth(null)
    }
  }
  const handleSidebarResizeDoubleClick = () => {
    const current = useSettingsStore.getState().settings.appearance.sidebarWidth
    if (current > 180) {
      setPrevSidebarWidth(current)
      setSidebarWidth(180)
    } else {
      setSidebarWidth(prevSidebarWidth > 180 ? prevSidebarWidth : 240)
    }
  }

  return (
    <Flex direction="column" className="h-screen bg-bg-primary text-text-primary">
      <SectionErrorBoundary label="Title bar">
        <TitleBar />
      </SectionErrorBoundary>
      <Flex className="flex-1 overflow-hidden">
        <SectionErrorBoundary label="Activity bar">
          <ActivityBar />
        </SectionErrorBoundary>
        {sidebarVisible && sidebarPosition === 'left' && (
          <>
            <Flex direction="column" style={{ width: effectiveSidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label="Sidebar">
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
              <SectionErrorBoundary label={activeTab?.title ?? 'Tab'} resetKey={activeTabId}>
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
                <SectionErrorBoundary label="Welcome">
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
                  <SectionErrorBoundary label="Bottom dock">
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
              <SectionErrorBoundary label="Sidebar">
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
              <SectionErrorBoundary label="Secondary sidebar">
                <SecondarySidebar />
              </SectionErrorBoundary>
            </Flex>
          </>
        )}
        <SectionErrorBoundary label="Secondary activity bar">
          <SecondaryActivityBar />
        </SectionErrorBoundary>
      </Flex>
      {showStatusBar && (
        <SectionErrorBoundary label="Status bar">
          <StatusBar />
        </SectionErrorBoundary>
      )}
      <ToastContainer />
      <SectionErrorBoundary label="Command palette">
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="MCP approval">
        <MCPApprovalDialog />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="Plugin restart banner">
        <PluginRestartBanner />
      </SectionErrorBoundary>
      <ConfirmDialog
        open={pendingCloseId !== null}
        title="Unsaved changes"
        message={(() => {
          if (!pendingCloseId) return ''
          const label = tabActions.get(pendingCloseId)?.label ?? 'this tab'
          return `${label} has unsaved changes. Close anyway?`
        })()}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="danger"
        onCancel={clearPendingClose}
        onConfirm={() => {
          const id = pendingCloseId
          clearPendingClose()
          if (id) closeTab(id)
        }}
      />
    </Flex>
  )
}
