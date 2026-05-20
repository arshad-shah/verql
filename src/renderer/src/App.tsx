import { useState, useEffect } from 'react'
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/tab-bar'
import { ToastContainer } from '@/components/shell/ToastContainer'
import { QueryPanel } from '@/components/query/QueryPanel'
import { ERDiagram } from '@/components/er/ERDiagram'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
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
import { PluginPanelMount } from '@/components/plugins/PluginPanelMount'
import { PluginRestartBanner } from '@/components/plugins/PluginRestartBanner'
import type { QueryTab, ErDiagramTab, ConnectionFormTab, PluginDetailTab } from '@shared/types'

export function App() {
  const { tabs, activeTabId, addQueryTab, closeTab, reopenTab } = useTabsStore()
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)
  const { activePanel, sidebarVisible, setSidebarWidth } = useUiStore()
  const sidebarWidth = useSettingsStore(s => s.settings.appearance.sidebarWidth)
  const sidebarPosition = useSettingsStore(s => s.settings.appearance.sidebarPosition)
  const activeConnectionId = useConnectionsStore(s => s.activeConnectionId)
  const activeTab = tabs.find(t => t.id === activeTabId)
  const isSettingsOpen = activePanel === 'settings'
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
        {isSettingsOpen ? (
          <Flex direction="column" className="flex-1 overflow-hidden">
            <SettingsLayout />
          </Flex>
        ) : (
          <>
            {sidebarVisible && sidebarPosition === 'left' && (
              <>
                <Flex direction="column" style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden">
                  <Sidebar />
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
              <Box className="flex-1 overflow-hidden">
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
            </Flex>
            {sidebarVisible && sidebarPosition === 'right' && (
              <>
                <ResizeHandle
                  direction="horizontal"
                  onResize={handleSidebarResize}
                  onDoubleClick={handleSidebarResizeDoubleClick}
                />
                <Flex direction="column" style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden">
                  <Sidebar />
                </Flex>
              </>
            )}
            <PluginPanelMount surface="panels" componentId="ai-chat-panel" />
          </>
        )}
      </Flex>
      <StatusBar />
      <ToastContainer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <MCPApprovalDialog />
      <PluginRestartBanner />
    </Flex>
  )
}
