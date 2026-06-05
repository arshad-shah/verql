import { useState, useEffect } from 'react'
import { useUiStore, ACTIVITY_PANEL } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
import { ExplorerTree } from '@/components/explorer/ExplorerTree'
import { SavedQueriesPanel } from '@/components/saved-queries/SavedQueriesPanel'
import { QueryHistoryPanel } from '@/components/query-history/QueryHistoryPanel'
import { ChartsDashboard } from '@/components/charts-panel/ChartsDashboard'
import { PluginsPanel } from '@/components/plugins/PluginsPanel'
import { ExportModal } from '@/components/export/ExportModal'
import { ImportModal } from '@/components/import/ImportModal'
import { Upload } from 'lucide-react'
import { Panel, Flex, Box, Text, ScrollArea, IconButton, Tooltip } from '@/primitives'

export function Sidebar() {
  const { activePanel } = useUiStore()
  const { activeConnectionId, connectedIds } = useConnectionsStore()

  const [exportTable, setExportTable] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [queryView, setQueryView] = useState<'saved' | 'history'>('saved')

  const panelContributions = usePluginUIStore(selectContributions('panels'))

  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('panels')
  }, [])

  const titles: Record<string, string> = {
    [ACTIVITY_PANEL.EXPLORER]: 'Explorer',
    [ACTIVITY_PANEL.QUERY]: 'Saved Queries',
    [ACTIVITY_PANEL.CHARTS]: 'Charts',
    [ACTIVITY_PANEL.PLUGINS]: 'Plugins',
    [ACTIVITY_PANEL.SETTINGS]: 'Settings',
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
        {isConnected && activePanel === ACTIVITY_PANEL.EXPLORER && (
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
        {activePanel === ACTIVITY_PANEL.EXPLORER && (
          <ExplorerTree onExportTable={(name) => setExportTable(name)} />
        )}
        {activePanel === ACTIVITY_PANEL.QUERY && (
          <Flex direction="column" className="h-full">
            {/* Segmented toggle between persisted saved queries and the
                run-history log. Both are query-scoped lists, so they share
                this sidebar slot rather than taking a second activity icon. */}
            <Flex gap="xs" className="px-2 pt-2 pb-1">
              {(['saved', 'history'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setQueryView(view)}
                  className={`flex-1 rounded-md px-2 py-1 text-xs capitalize transition-colors ${
                    queryView === view
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {view}
                </button>
              ))}
            </Flex>
            <Box className="flex-1 min-h-0">
              {queryView === 'saved' ? <SavedQueriesPanel /> : <QueryHistoryPanel />}
            </Box>
          </Flex>
        )}
        {activePanel === ACTIVITY_PANEL.CHARTS && (
          isConnected ? <ChartsDashboard /> : (
            <Text size="xs" color="muted" as="p" className="px-3 py-8 text-center">
              Connect and run queries to see charts
            </Text>
          )
        )}
        {activePanel === ACTIVITY_PANEL.PLUGINS && <PluginsPanel />}
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
