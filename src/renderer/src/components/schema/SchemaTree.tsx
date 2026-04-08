import { useEffect, useState } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { SchemaTreeItem, TableIcon, ColumnIcon } from './SchemaTreeItem'
import { RefreshCw, ChevronDown, Database, Layers, Download, Upload } from 'lucide-react'
import { ExportModal } from '@/components/export/ExportModal'
import { ImportModal } from '@/components/import/ImportModal'

export function SchemaTree() {
  const { activeConnectionId, connectedIds, connections } = useConnectionsStore()
  const { tables, columns, schemas, expandedTables, fetchSchemas, fetchDatabases, fetchTables, fetchColumns, toggleTable, clearCache } = useSchemaStore()

  const addToast = useToastStore((s) => s.addToast)

  const connectionId = activeConnectionId
  const isConnected = connectionId && connectedIds.has(connectionId)
  const conn = connections.find(c => c.id === connectionId)

  const [exportTable, setExportTable] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
  const [activeSchema, setActiveSchema] = useState(defaultSchema)
  const [activeDatabase, setActiveDatabase] = useState(conn?.database ?? '')
  const [showSchemaPicker, setShowSchemaPicker] = useState(false)
  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)
  const schemaList = connectionId ? schemas.get(connectionId) ?? [] : []

  useEffect(() => {
    setActiveSchema(defaultSchema)
    setActiveDatabase(conn?.database ?? '')
  }, [defaultSchema, conn?.database])

  // Fetch schemas, databases, and tables
  useEffect(() => {
    if (!isConnected || !connectionId) return

    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))

    fetchSchemas(connectionId).then(() => {
      fetchTables(connectionId, activeSchema)
    })
  }, [connectionId, isConnected, activeSchema])

  if (!isConnected || !connectionId) {
    return <p className="text-text-muted text-xs px-3 py-6 text-center">Connect to browse schema</p>
  }

  const tableKey = `${connectionId}:${activeSchema}`
  const tableList = tables.get(tableKey) ?? []

  const handleExpandTable = async (tableName: string) => {
    const key = `${connectionId}:${activeSchema}:${tableName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, tableName, activeSchema)
    }
  }

  const handleRefresh = () => {
    clearCache(connectionId)
    setDatabaseList([])
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId).then(() => fetchTables(connectionId, activeSchema))
  }

  const handleSchemaChange = (s: string) => {
    setActiveSchema(s)
    setShowSchemaPicker(false)
  }

  const handleSwitchDatabase = async (db: string) => {
    if (!connectionId || db === activeDatabase) return
    setSwitching(true)
    try {
      await window.electronAPI.invoke('db:switch-database', connectionId, db)
      clearCache(connectionId)
      setActiveDatabase(db)
      // Re-fetch schemas for the new database, then pick default
      const newSchemas = await fetchSchemas(connectionId)
      const newDefault = conn?.type === 'mysql' ? db : 'public'
      const resolved = newSchemas.includes(newDefault) ? newDefault : newSchemas[0] ?? 'public'
      setActiveSchema(resolved)
      addToast({ type: 'success', title: `Switched to ${db}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to switch database', message: (err as Error).message })
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="py-1">
      {/* Database & schema header */}
      <div className="flex items-center justify-between px-3 py-1 mb-1 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Database indicator */}
          {databaseList.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted shrink-0" title={`Database: ${activeDatabase}`}>
              <Database size={10} />
              <span className="truncate max-w-16">{activeDatabase}</span>
              <span className="text-text-muted">/</span>
            </span>
          )}

          {/* Schema selector */}
          <div className="relative">
            <button
              onClick={() => setShowSchemaPicker(!showSchemaPicker)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <Layers size={10} />
              <span className="truncate max-w-20">{activeSchema}</span>
              {schemaList.length > 1 && <ChevronDown size={10} />}
            </button>
            {showSchemaPicker && schemaList.length > 1 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSchemaPicker(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-[140px] py-1 max-h-48 overflow-y-auto">
                  {schemaList.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSchemaChange(s)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                        activeSchema === s ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      <Layers size={10} className="shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <button onClick={handleRefresh} className="text-text-muted hover:text-text-primary transition-colors shrink-0" title="Refresh">
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Other databases on server */}
      {databaseList.length > 1 && (
        <div className="px-3 pb-1 mb-1 border-b border-border">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Databases</p>
          <div className="flex flex-wrap gap-1">
            {databaseList.map(db => (
              <button
                key={db}
                onClick={() => handleSwitchDatabase(db)}
                disabled={switching || db === activeDatabase}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                  db === activeDatabase
                    ? 'bg-accent/10 text-accent'
                    : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary cursor-pointer'
                } disabled:opacity-50`}
              >
                <Database size={9} />
                {db}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tables */}
      {tableList.length === 0 && (
        <p className="text-text-muted text-xs px-3 py-4 text-center">No tables found</p>
      )}

      {tableList.map(table => {
        const colKey = `${connectionId}:${activeSchema}:${table.name}`
        const isExpanded = expandedTables.has(colKey)
        const cols = columns.get(colKey) ?? []

        return (
          <SchemaTreeItem
            key={table.name}
            label={table.name}
            icon={<TableIcon type={table.type} />}
            depth={0}
            expanded={isExpanded}
            onToggle={() => handleExpandTable(table.name)}
            actions={
              <button
                onClick={(e) => { e.stopPropagation(); setExportTable(table.name) }}
                className="p-0.5 text-text-muted hover:text-accent rounded"
                title={`Export ${table.name}`}
              >
                <Download size={10} />
              </button>
            }
          >
            {cols.map(col => (
              <SchemaTreeItem
                key={col.name}
                label={`${col.name} ${col.dataType}`}
                icon={<ColumnIcon column={col} />}
                depth={1}
              />
            ))}
          </SchemaTreeItem>
        )
      })}

      {/* Import button */}
      {connectionId && (
        <div className="px-2 pt-2 border-t border-border mt-1">
          <button
            onClick={() => setShowImport(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-white/5 rounded transition-colors"
          >
            <Upload size={12} /> Import data...
          </button>
        </div>
      )}

      {/* Modals */}
      {exportTable && connectionId && (
        <ExportModal tableName={exportTable} connectionId={connectionId} onClose={() => setExportTable(null)} />
      )}
      {showImport && connectionId && (
        <ImportModal connectionId={connectionId} onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
