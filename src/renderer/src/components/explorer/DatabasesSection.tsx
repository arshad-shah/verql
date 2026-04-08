import { useEffect, useState } from 'react'
import { RefreshCw, ChevronDown, Database, Layers, GitFork } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { AccordionSection } from './AccordionSection'

interface DatabasesSectionProps {
  connectionId: string
  activeSchema: string
  onSchemaChange: (schema: string) => void
  activeDatabase: string
  onDatabaseChange: (db: string) => void
}

export function DatabasesSection({ connectionId, activeSchema, onSchemaChange, activeDatabase, onDatabaseChange }: DatabasesSectionProps) {
  const { schemas, fetchSchemas, fetchDatabases, clearCache } = useSchemaStore()
  const conn = useConnectionsStore((s) => s.connections.find(c => c.id === connectionId))
  const { openErDiagram } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)
  const [showSchemaPicker, setShowSchemaPicker] = useState(false)

  const schemaList = schemas.get(connectionId) ?? []
  const isSqlite = conn?.type === 'sqlite'

  useEffect(() => {
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }, [connectionId, fetchDatabases, fetchSchemas])

  const handleRefresh = () => {
    clearCache(connectionId)
    setDatabaseList([])
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }

  const handleSwitchDatabase = async (db: string) => {
    if (db === activeDatabase || switching) return
    setSwitching(true)
    try {
      await window.electronAPI.invoke('db:switch-database', connectionId, db)
      clearCache(connectionId)
      onDatabaseChange(db)
      const newSchemas = await fetchSchemas(connectionId)
      const newDefault = conn?.type === 'mysql' ? db : 'public'
      const resolved = newSchemas.includes(newDefault) ? newDefault : newSchemas[0] ?? 'public'
      onSchemaChange(resolved)
      addToast({ type: 'success', title: `Switched to ${db}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to switch database', message: (err as Error).message })
    } finally {
      setSwitching(false)
    }
  }

  const handleOpenErDiagram = () => {
    openErDiagram(connectionId, activeSchema)
  }

  if (isSqlite && databaseList.length <= 1 && schemaList.length <= 1) return null

  return (
    <AccordionSection
      title="DATABASES"
      count={databaseList.length || undefined}
      actions={
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenErDiagram}
            className="p-0.5 text-text-muted hover:text-accent rounded transition-colors"
            title="ER Diagram"
          >
            <GitFork size={12} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      }
    >
      <div className="px-2 py-1">
        {databaseList.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {databaseList.map(db => (
              <button
                key={db}
                onClick={() => handleSwitchDatabase(db)}
                disabled={switching || db === activeDatabase}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                  db === activeDatabase
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary border border-border cursor-pointer'
                } disabled:opacity-50`}
              >
                <Database size={9} />
                {db}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">Schema:</span>
          <button
            onClick={() => setShowSchemaPicker(!showSchemaPicker)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Layers size={10} />
            <span className="truncate max-w-24">{activeSchema}</span>
            {schemaList.length > 1 && <ChevronDown size={10} />}
          </button>
          {showSchemaPicker && schemaList.length > 1 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSchemaPicker(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-32 py-1 max-h-48 overflow-y-auto">
                {schemaList.map(s => (
                  <button
                    key={s}
                    onClick={() => { onSchemaChange(s); setShowSchemaPicker(false) }}
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
    </AccordionSection>
  )
}
