import { useEffect, useState } from 'react'
import { Database, ChevronDown, Layers } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { useToastStore } from '@/stores/toast'
import { useTabsStore } from '@/stores/tabs'
import { Button, Text, Divider, ScrollArea } from '@/primitives'

interface Props {
  tabId: string
  connectionId: string | null
  schema: string | null
}

export function ConnectionSelector({ tabId, connectionId, schema }: Props) {
  const { connections, connectedIds, connect } = useConnectionsStore()
  const { fetchSchemas, fetchDatabases, clearCache } = useSchemaStore()
  const addToast = useToastStore((s) => s.addToast)
  const { setTabConnection, setTabSchema } = useTabsStore()
  const [showConnDropdown, setShowConnDropdown] = useState(false)
  const [showSchemaDropdown, setShowSchemaDropdown] = useState(false)
  const [schemaList, setSchemaList] = useState<string[]>([])
  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [activeDatabase, setActiveDatabase] = useState('')

  const connectedList = connections.filter(c => connectedIds.has(c.id))
  const activeConn = connections.find(c => c.id === connectionId)

  // Fetch schemas and databases when connection changes
  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId)) {
      setSchemaList([])
      setDatabaseList([])
      setActiveDatabase('')
      return
    }

    setActiveDatabase(activeConn?.database ?? '')

    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))

    fetchSchemas(connectionId).then(s => {
      setSchemaList(s)
      // Auto-set default schema if none selected
      if (!schema && s.length > 0) {
        const conn = connections.find(c => c.id === connectionId)
        const defaultSchema = conn?.type === 'sqlite' ? 'main' : conn?.type === 'mysql' ? conn.database : 'public'
        const resolved = s.includes(defaultSchema) ? defaultSchema : s[0]
        setTabSchema(tabId, resolved)
      }
    })
  }, [connectionId, connectedIds])

  const handleSelectConnection = (id: string) => {
    setTabConnection(tabId, id)
    setShowConnDropdown(false)
  }

  const handleSelectSchema = (s: string) => {
    setTabSchema(tabId, s)
    setShowSchemaDropdown(false)
  }

  const handleSwitchDatabase = async (db: string) => {
    if (!connectionId || db === activeDatabase) return
    try {
      await window.electronAPI.invoke('db:switch-database', connectionId, db)
      clearCache(connectionId)
      setActiveDatabase(db)
      // Re-fetch schemas for the new database
      const newSchemas = await fetchSchemas(connectionId)
      setSchemaList(newSchemas)
      const conn = connections.find(c => c.id === connectionId)
      const newDefault = conn?.type === 'mysql' ? db : 'public'
      const resolved = newSchemas.includes(newDefault) ? newDefault : newSchemas[0] ?? 'public'
      setTabSchema(tabId, resolved)
      addToast({ type: 'success', title: `Switched to ${db}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to switch database', message: (err as Error).message })
    }
    setShowConnDropdown(false)
  }

  const closeAllDropdowns = () => {
    setShowConnDropdown(false)
    setShowSchemaDropdown(false)
  }

  return (
    <div className="relative flex items-center gap-1">
      {/* Connection selector */}
      <Button
        variant="outline"
        size="xs"
        onClick={() => { setShowConnDropdown(!showConnDropdown); setShowSchemaDropdown(false) }}
        className="flex items-center gap-1.5"
      >
        {activeConn ? (
          <>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeConn.color ?? '#7c6ff7' }} />
            <Text size="xs" color="primary" truncate className="max-w-28">{activeConn.name}</Text>
          </>
        ) : (
          <>
            <Database size={12} className="text-text-muted" />
            <Text size="xs" color="muted">No connection</Text>
          </>
        )}
        <ChevronDown size={10} className="text-text-muted" />
      </Button>

      {/* Schema selector */}
      {activeConn && schemaList.length > 0 && (
        <>
          <Text size="xs" color="muted">/</Text>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setShowSchemaDropdown(!showSchemaDropdown); setShowConnDropdown(false) }}
            className="flex items-center gap-1"
          >
            <Layers size={11} className="text-text-muted" />
            <Text size="xs" color="secondary" truncate className="max-w-24">{schema ?? 'schema'}</Text>
            <ChevronDown size={10} className="text-text-muted" />
          </Button>
        </>
      )}

      {/* Backdrop for any dropdown */}
      {(showConnDropdown || showSchemaDropdown) && (
        <div className="fixed inset-0 z-40" onClick={closeAllDropdowns} />
      )}

      {/* Connection dropdown */}
      {showConnDropdown && (
        <ScrollArea direction="vertical" className="absolute top-full left-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-[260px] py-1 max-h-80">
          {/* Active connections */}
          {connectedList.length === 0 && (
            <Text size="xs" color="muted" as="p" className="px-3 py-2">No active connections</Text>
          )}
          {connectedList.map(conn => (
            <button
              key={conn.id}
              onClick={() => handleSelectConnection(conn.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                connectionId === conn.id ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conn.color ?? '#7c6ff7' }} />
              <span className="truncate">{conn.name}</span>
              <Text size="xs" color="muted" className="ml-auto">{conn.database}</Text>
            </button>
          ))}

          {/* Databases on current server */}
          {databaseList.length > 1 && connectionId && (
            <>
              <Divider />
              <Text size="xs" color="muted" as="p" className="px-3 py-0.5 text-[10px] uppercase tracking-wider">Databases on server</Text>
              {databaseList.map(db => {
                const isCurrent = db === activeDatabase
                return (
                  <button
                    key={db}
                    onClick={() => handleSwitchDatabase(db)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                      isCurrent ? 'text-accent' : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'
                    }`}
                  >
                    <Database size={11} className="shrink-0" />
                    <span className="truncate">{db}</span>
                    {isCurrent && <Text size="xs" color="accent" className="ml-auto text-[10px]">active</Text>}
                  </button>
                )
              })}
            </>
          )}

          {/* Disconnected connections */}
          {connections.filter(c => !connectedIds.has(c.id)).length > 0 && (
            <>
              <Divider />
              <Text size="xs" color="muted" as="p" className="px-3 py-0.5 text-[10px] uppercase tracking-wider">Disconnected</Text>
              {connections.filter(c => !connectedIds.has(c.id)).map(conn => (
                <button
                  key={conn.id}
                  onClick={async () => {
                    const result = await connect(conn.id)
                    if (result.success) handleSelectConnection(conn.id)
                    setShowConnDropdown(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full shrink-0 bg-text-muted" />
                  <span className="truncate">{conn.name}</span>
                  <Text size="xs" color="muted" className="ml-auto text-[10px]">click to connect</Text>
                </button>
              ))}
            </>
          )}
        </ScrollArea>
      )}

      {/* Schema dropdown */}
      {showSchemaDropdown && (
        <ScrollArea direction="vertical" className="absolute top-full right-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-[180px] py-1 max-h-60">
          {schemaList.length === 0 && (
            <Text size="xs" color="muted" as="p" className="px-3 py-2">No schemas found</Text>
          )}
          {schemaList.map(s => (
            <button
              key={s}
              onClick={() => handleSelectSchema(s)}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                schema === s ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Layers size={11} className="shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
