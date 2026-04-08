import { useState, useEffect } from 'react'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import { SearchFilter } from '@/components/explorer/SearchFilter'
import { ConnectionsSection } from '@/components/explorer/ConnectionsSection'
import { DatabasesSection } from '@/components/explorer/DatabasesSection'
import { TablesSection } from '@/components/explorer/TablesSection'
import { ViewsSection } from '@/components/explorer/ViewsSection'
import { SavedQueriesPanel } from '@/components/saved-queries/SavedQueriesPanel'
import { ChartsDashboard } from '@/components/charts-panel/ChartsDashboard'
import { ExtensionsPanel } from '@/components/plugins/ExtensionsPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { ExportModal } from '@/components/export/ExportModal'
import { ImportModal } from '@/components/import/ImportModal'
import { Upload } from 'lucide-react'
import { Panel, Flex, Text, ScrollArea, IconButton, Tooltip } from '@/primitives'

export function Sidebar() {
  const { activePanel } = useUiStore()
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()

  const [exportTable, setExportTable] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    charts: 'Charts',
    extensions: 'Extensions',
    settings: 'Settings'
  }

  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)
  const conn = connections.find(c => c.id === activeConnectionId)

  const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
  const [activeSchema, setActiveSchema] = useState(defaultSchema ?? 'public')
  const [activeDatabase, setActiveDatabase] = useState(conn?.database ?? '')

  // Reset schema and database when connection changes
  useEffect(() => {
    const newDefault = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
    setActiveSchema(newDefault ?? 'public')
    setActiveDatabase(conn?.database ?? '')
  }, [activeConnectionId, conn?.type, conn?.database])

  return (
    <Panel className="w-full h-full flex flex-col border-r border-b-0 border-t-0">
      <Flex
        align="center"
        justify="between"
        className="px-3 py-2 border-b border-border"
      >
        <Text size="xs" color="muted" className="uppercase tracking-wider">
          {titles[activePanel] ?? 'Explorer'}
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
          <>
            {isConnected && <SearchFilter />}
            <ConnectionsSection />
            {isConnected && activeConnectionId && (
              <>
                <DatabasesSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                  onSchemaChange={setActiveSchema}
                  activeDatabase={activeDatabase}
                  onDatabaseChange={setActiveDatabase}
                />
                <TablesSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                  onExportTable={setExportTable}
                />
                <ViewsSection
                  connectionId={activeConnectionId}
                  activeSchema={activeSchema}
                />
              </>
            )}
          </>
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
        {activePanel === 'settings' && <SettingsPanel />}
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
