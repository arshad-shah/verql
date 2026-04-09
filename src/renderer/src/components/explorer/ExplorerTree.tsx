import { useEffect } from 'react'
import { Database } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { EmptyState } from '@/primitives/data-display/EmptyState'
import { Text } from '@/primitives/typography/Text'
import { ConnectionSwitcher } from './ConnectionSwitcher'
import { SearchFilter } from './SearchFilter'
import { DatabaseNode } from './DatabaseNode'
import { SchemaNode } from './SchemaNode'
import { TableNode } from './TableNode'
import { ViewNode } from './ViewNode'

interface ExplorerTreeProps {
  onExportTable?: (tableName: string) => void
}

export function ExplorerTree({ onExportTable }: ExplorerTreeProps) {
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const connectedIds = useConnectionsStore((s) => s.connectedIds)

  const databases = useSchemaStore((s) => s.databases)
  const schemas = useSchemaStore((s) => s.schemas)
  const tables = useSchemaStore((s) => s.tables)
  const filterText = useSchemaStore((s) => s.filterText)
  const fetchDatabases = useSchemaStore((s) => s.fetchDatabases)
  const fetchSchemas = useSchemaStore((s) => s.fetchSchemas)
  const fetchTables = useSchemaStore((s) => s.fetchTables)

  const isConnected = activeConnectionId != null && connectedIds.has(activeConnectionId)

  // Fetch databases and schemas when connection changes
  useEffect(() => {
    if (!activeConnectionId || !connectedIds.has(activeConnectionId)) return
    fetchDatabases(activeConnectionId)
    fetchSchemas(activeConnectionId)
  }, [activeConnectionId, connectedIds, fetchDatabases, fetchSchemas])

  // Derive hierarchy shape
  const databaseList = activeConnectionId ? (databases.get(activeConnectionId) ?? []) : []
  const schemaList = activeConnectionId ? (schemas.get(activeConnectionId) ?? []) : []

  const isSingleDb = databaseList.length <= 1
  const isSingleSchema = schemaList.length === 1
  const isFlat = isSingleDb && isSingleSchema

  // For the flat (single-DB + single-schema) case, fetch tables immediately
  const defaultSchema = schemaList[0] ?? 'public'
  const tableCacheKey = activeConnectionId ? `${activeConnectionId}:${defaultSchema}` : ''
  const allTables = tables.get(tableCacheKey) ?? []

  useEffect(() => {
    if (!isFlat || !activeConnectionId || !isConnected) return
    fetchTables(activeConnectionId, defaultSchema)
  }, [isFlat, activeConnectionId, isConnected, defaultSchema, fetchTables])

  // Filter tables/views for the flat view
  const filter = filterText.toLowerCase()
  const filteredTables = allTables.filter(
    (t) => t.type === 'table' && t.name.toLowerCase().includes(filter)
  )
  const filteredViews = allTables.filter(
    (t) => t.type === 'view' && t.name.toLowerCase().includes(filter)
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <ConnectionSwitcher />

      {!isConnected ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            title="No connection"
            description="Select a connection to browse databases"
            icon={<Database size={32} className="text-[var(--color-text-disabled)]" />}
          />
        </div>
      ) : (
        <>
          <SearchFilter />

          {/* Flat: single-DB + single-schema (e.g. SQLite) */}
          {isFlat && (
            <div className="py-1 flex-1 overflow-y-auto min-h-0">
              {filteredTables.length > 0 && (
                <div>
                  <Text
                    size="xs"
                    color="muted"
                    weight="medium"
                    className="uppercase tracking-wider opacity-40 px-4 py-1"
                  >
                    Tables
                  </Text>
                  {filteredTables.map((t) => (
                    <TableNode
                      key={t.name}
                      tableName={t.name}
                      connectionId={activeConnectionId}
                      schema={defaultSchema}
                      depth={0}
                      onExportTable={onExportTable}
                    />
                  ))}
                </div>
              )}
              {filteredViews.length > 0 && (
                <div>
                  <Text
                    size="xs"
                    color="muted"
                    weight="medium"
                    className="uppercase tracking-wider opacity-40 px-4 py-1"
                  >
                    Views
                  </Text>
                  {filteredViews.map((v) => (
                    <ViewNode
                      key={v.name}
                      viewName={v.name}
                      connectionId={activeConnectionId}
                      schema={defaultSchema}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single-DB + multiple schemas */}
          {isSingleDb && !isSingleSchema && (
            <div className="py-1 flex-1 overflow-y-auto min-h-0">
              {schemaList.map((s) => (
                <SchemaNode
                  key={s}
                  schemaName={s}
                  connectionId={activeConnectionId}
                  depth={0}
                  onExportTable={onExportTable}
                />
              ))}
            </div>
          )}

          {/* Multiple databases */}
          {!isSingleDb && (
            <div className="py-1 flex-1 overflow-y-auto min-h-0">
              {databaseList.map((db) => (
                <DatabaseNode
                  key={db}
                  databaseName={db}
                  connectionId={activeConnectionId}
                  depth={0}
                  onExportTable={onExportTable}
                />
              ))}
              {databaseList.length === 0 && (
                <Text size="xs" color="muted" className="px-4 py-2">
                  Loading databases…
                </Text>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
