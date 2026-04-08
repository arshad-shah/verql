import { useUiStore } from '@/stores/ui'
import { ConnectionList } from '@/components/connections/ConnectionList'
import { SchemaTree } from '@/components/schema/SchemaTree'
import { SavedQueriesPanel } from '@/components/saved-queries/SavedQueriesPanel'
import { ChartsDashboard } from '@/components/charts-panel/ChartsDashboard'
import { ExtensionsPanel } from '@/components/plugins/ExtensionsPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { PenSquare, GitFork } from 'lucide-react'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()
  const { addQueryTab, openErDiagram } = useTabsStore()

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    schema: 'Schema',
    charts: 'Charts',
    extensions: 'Extensions',
    settings: 'Settings'
  }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)
  const conn = connections.find(c => c.id === activeConnectionId)

  const handleOpenErDiagram = () => {
    if (!activeConnectionId || !conn) return
    const schema = conn.type === 'sqlite' ? 'main' : conn.type === 'mysql' ? conn.database : 'public'
    openErDiagram(activeConnectionId, schema)
  }

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border flex items-center justify-between">
        <span>{titles[activePanel] ?? 'Explorer'}</span>
        {isConnected && activePanel === 'explorer' && (
          <div className="flex items-center gap-1">
            <button onClick={handleOpenErDiagram} className="text-text-muted hover:text-accent transition-colors" title="ER Diagram">
              <GitFork size={12} />
            </button>
            <button onClick={() => addQueryTab(activeConnectionId)} className="text-text-muted hover:text-accent transition-colors" title="New Query">
              <PenSquare size={12} />
            </button>
          </div>
        )}
        {activePanel === 'schema' && isConnected && (
          <button onClick={handleOpenErDiagram} className="text-text-muted hover:text-accent transition-colors" title="ER Diagram">
            <GitFork size={12} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'explorer' && (
          <>
            <ConnectionList />
            {isConnected && (
              <div className="border-t border-border mt-1 pt-1">
                <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Schema</div>
                <SchemaTree />
              </div>
            )}
          </>
        )}
        {activePanel === 'query' && <SavedQueriesPanel />}
        {activePanel === 'schema' && (
          isConnected ? <SchemaTree /> : (
            <p className="text-text-muted text-xs px-3 py-8 text-center">Connect to a database to browse schema</p>
          )
        )}
        {activePanel === 'charts' && (
          isConnected ? <ChartsDashboard /> : (
            <p className="text-text-muted text-xs px-3 py-8 text-center">Connect and run queries to see charts</p>
          )
        )}
        {activePanel === 'extensions' && <ExtensionsPanel />}
        {activePanel === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
