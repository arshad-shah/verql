import { useState, useEffect } from 'react'
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/TabBar'
import { ToastContainer } from '@/components/shell/ToastContainer'
import { QueryPanel } from '@/components/query/QueryPanel'
import { ERDiagram } from '@/components/er/ERDiagram'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab, ErDiagramTab } from '@shared/types'

export function App() {
  const { tabs, activeTabId } = useTabsStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Cmd+Shift+P to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab?.type === 'query' && (
              <QueryPanel tab={activeTab as QueryTab} />
            )}
            {activeTab?.type === 'er-diagram' && (
              <ERDiagram
                connectionId={(activeTab as ErDiagramTab).connectionId}
                schema={(activeTab as ErDiagramTab).schema}
              />
            )}
            {!activeTab && (
              <div className="flex-1 flex items-center justify-center bg-bg-tertiary h-full">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold mb-2">dbstudio</h1>
                  <p className="text-text-secondary">Connect to a database to get started</p>
                  <p className="text-text-muted text-sm mt-1">Cmd+Shift+P to open command palette</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <StatusBar />
      <ToastContainer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
