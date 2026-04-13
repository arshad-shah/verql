import { useState, useEffect } from 'react'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
import { ExplorerTree } from '@/components/explorer/ExplorerTree'
import { SavedQueriesPanel } from '@/components/saved-queries/SavedQueriesPanel'
import { ChartsDashboard } from '@/components/charts-panel/ChartsDashboard'
import { ExtensionsPanel } from '@/components/plugins/ExtensionsPanel'
import { ExportModal } from '@/components/export/ExportModal'
import { ImportModal } from '@/components/import/ImportModal'
import { Upload } from 'lucide-react'
import { Panel, Flex, Text, ScrollArea, IconButton, Tooltip } from '@/primitives'

export function Sidebar() {
  const { activePanel } = useUiStore()
  const { activeConnectionId, connectedIds } = useConnectionsStore()

  const [exportTable, setExportTable] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const panelContributions = usePluginUIStore(selectContributions('panels'))

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('panels')
  }, [])

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    charts: 'Charts',
    extensions: 'Extensions',
    settings: 'Settings'
  }
  const pluginTitles = Object.fromEntries(
    panelContributions.map((c) => [`plugin:${c.contributionId}`, c.pluginName])
  )
  const allTitles: Record<string, string> = { ...titles, ...pluginTitles }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)

  return (
    <Panel className="w-full h-full flex flex-col border-r border-b-0 border-t-0">
      <Flex
        align="center"
        justify="between"
        className="px-3 py-2 border-b border-border"
      >
        <Text size="xs" color="muted" className="uppercase tracking-wider">
          {allTitles[activePanel] ?? 'Explorer'}
        </Text>
        {isConnected && activePanel === 'explorer' && (
          <Tooltip content="Import data" side="left">
            <IconButton
              label="Import data"
              size="xs"
              variant="ghost"
              onClick={() => setShowImport(true)}
              className="text-text-muted hover:text-accent"
            >
              <Upload size={12} />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
      <ScrollArea direction="vertical" className="flex-1">
        {activePanel === 'explorer' && (
          <ExplorerTree onExportTable={(name) => setExportTable(name)} />
        )}
        {activePanel === 'query' && <SavedQueriesPanel />}
        {activePanel === 'charts' && (
          isConnected ? <ChartsDashboard /> : (
            <Text size="xs" color="muted" as="p" className="px-3 py-8 text-center">
              Connect and run queries to see charts
            </Text>
          )
        )}
        {activePanel === 'extensions' && <ExtensionsPanel />}
        {/* Plugin-contributed panels */}
        {panelContributions
          .filter((c) => activePanel === `plugin:${c.contributionId}`)
          .map((c) => (
            <div key={c.contributionId} className="p-3 space-y-2">
              <WidgetRenderer widgets={c.widgets} pluginId={c.pluginId} />
            </div>
          ))}
      </ScrollArea>

      {/* Modals */}
      {exportTable && activeConnectionId && (
        <ExportModal tableName={exportTable} connectionId={activeConnectionId} onClose={() => setExportTable(null)} />
      )}
      {showImport && activeConnectionId && (
        <ImportModal connectionId={activeConnectionId} onClose={() => setShowImport(false)} />
      )}
    </Panel>
  )
}
