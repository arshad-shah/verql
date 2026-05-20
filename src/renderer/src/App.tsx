import { useState, useEffect } from 'react'
import { BottomDock } from '@/components/shell/BottomDock'
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
import { Flex, Box, Heading, Text, ResizeHandle } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
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
import { SecondarySidebar } from '@/components/shell/SecondarySidebar'
import { SecondaryActivityBar } from '@/components/shell/SecondaryActivityBar'
import type { QueryTab, ErDiagramTab, ConnectionFormTab, PluginDetailTab } from '@shared/types'

export function App() {
  const { tabs, activeTabId, addQueryTab, closeTab, reopenTab } = useTabsStore()
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)
  const { sidebarVisible, setSidebarWidth } = useUiStore()
  const sidebarWidth = useSettingsStore(s => s.settings.appearance.sidebarWidth)
  const sidebarPosition = useSettingsStore(s => s.settings.appearance.sidebarPosition)
  const showStatusBar = useSettingsStore(s => s.settings.appearance.showStatusBar)
  const bottomDockHeight = useSettingsStore(s => s.settings.appearance.bottomDockHeight)
  const showBottomDock = useSettingsStore(s => s.settings.appearance.showBottomDock)
  const bottomDockVisible = useUiStore(s => s.bottomDockVisible)
  const setBottomDockHeight = useUiStore(s => s.setBottomDockHeight)
  const secondarySidebarWidth = useSettingsStore(s => s.settings.appearance.secondarySidebarWidth)
  const showSecondarySidebar = useSettingsStore(s => s.settings.appearance.showSecondarySidebar)
  const secondarySidebarVisible = useUiStore(s => s.secondarySidebarVisible)
  const setSecondarySidebarWidth = useUiStore(s => s.setSecondarySidebarWidth)
  const activeConnectionId = useConnectionsStore(s => s.activeConnectionId)
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [prevSidebarWidth, setPrevSidebarWidth] = useState(sidebarWidth)

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
        if (activeTabId) closeTab(activeTabId)
      }
      if (mod && e.key === 't' && !e.shiftKey) {
        e.preventDefault()
        addQueryTab(activeConnectionId)
      }
      if (mod && e.shiftKey && e.key === 't') {
        e.preventDefault()
        reopenTab()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Listen for native menu commands
    const cleanups = [
      window.electronAPI.on('menu:new-query-tab', () => addQueryTab(activeConnectionId)),
      window.electronAPI.on('menu:new-connection', () => openConnectionForm()),
      window.electronAPI.on('menu:toggle-command-palette', () => setPaletteOpen(prev => !prev)),
    ]

    const handleStatusBarNewConn = () => openConnectionForm()
    window.addEventListener('statusbar:new-connection', handleStatusBarNewConn)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('statusbar:new-connection', handleStatusBarNewConn)
      cleanups.forEach(cleanup => cleanup())
    }
  }, [activeConnectionId, activeTabId, addQueryTab, closeTab, reopenTab, openConnectionForm])

  useEffect(() => {
    useUiStore.setState({ bottomDockVisible: showBottomDock })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    useUiStore.setState({ secondarySidebarVisible: showSecondarySidebar })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [prevBottomDockHeight, setPrevBottomDockHeight] = useState(bottomDockHeight)
  const handleBottomResize = (delta: number) => {
    const current = useSettingsStore.getState().settings.appearance.bottomDockHeight
    setBottomDockHeight(current - delta)
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

  const [prevSecondaryWidth, setPrevSecondaryWidth] = useState(secondarySidebarWidth)
  const handleSecondaryResize = (delta: number) => {
    const current = useSettingsStore.getState().settings.appearance.secondarySidebarWidth
    setSecondarySidebarWidth(current - delta)
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

  const handleSidebarResize = (delta: number) => {
    const current = useSettingsStore.getState().settings.appearance.sidebarWidth
    setSidebarWidth(current + delta)
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
      <TitleBar />
      <Flex className="flex-1 overflow-hidden">
        <ActivityBar />
        {sidebarVisible && sidebarPosition === 'left' && (
          <>
            <Flex direction="column" style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label="Sidebar">
                <Sidebar />
              </SectionErrorBoundary>
            </Flex>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSidebarResize}
              onDoubleClick={handleSidebarResizeDoubleClick}
            />
          </>
        )}
        <Flex direction="column" className="flex-1 overflow-hidden">
          <TabBar />
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
                <Flex align="center" justify="center" className="flex-1 bg-bg-tertiary h-full">
                  <Box className="text-center">
                    <Heading level={1} className="text-2xl mb-2">dbstudio</Heading>
                    <Text color="secondary" as="p">Connect to a database to get started</Text>
                    <Text color="muted" size="sm" as="p" className="mt-1">Cmd+Shift+P to open command palette</Text>
                  </Box>
                </Flex>
              )}
            </Box>
            {bottomDockVisible && (
              <>
                <ResizeHandle
                  direction="vertical"
                  onResize={handleBottomResize}
                  onDoubleClick={handleBottomResizeDoubleClick}
                />
                <Box style={{ height: bottomDockHeight }} className="shrink-0">
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
              onDoubleClick={handleSidebarResizeDoubleClick}
            />
            <Flex direction="column" style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden">
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
              onDoubleClick={handleSecondaryResizeDoubleClick}
            />
            <Flex direction="column" style={{ width: secondarySidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label="Secondary sidebar">
                <SecondarySidebar />
              </SectionErrorBoundary>
            </Flex>
          </>
        )}
        <SecondaryActivityBar />
      </Flex>
      {showStatusBar && (
        <SectionErrorBoundary label="Status bar">
          <StatusBar />
        </SectionErrorBoundary>
      )}
      <ToastContainer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <MCPApprovalDialog />
      <PluginRestartBanner />
    </Flex>
  )
}
