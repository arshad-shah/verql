import { useEffect, useState } from 'react'
import { RefreshCw, ChevronDown, Database, Layers, GitFork } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { AccordionSection } from './AccordionSection'
import { IconButton, Text, ScrollArea, Box, Flex, Button } from '@/primitives'

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
        <Flex align="center" gap="xs">
          <IconButton
            label="ER Diagram"
            size="xs"
            variant="ghost"
            onClick={handleOpenErDiagram}
            className="text-text-muted hover:text-accent"
          >
            <GitFork size={12} />
          </IconButton>
          <IconButton
            label="Refresh"
            size="xs"
            variant="ghost"
            onClick={handleRefresh}
            className="text-text-muted hover:text-text-primary"
          >
            <RefreshCw size={11} />
          </IconButton>
        </Flex>
      }
    >
      <Box className="px-2 py-1">
        {databaseList.length > 1 && (
          <Flex wrap gap="xs" className="mb-2">
            {databaseList.map(db => (
              <Button
                key={db}
                variant="outline"
                size="xs"
                onClick={() => handleSwitchDatabase(db)}
                disabled={switching || db === activeDatabase}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] h-auto ${
                  db === activeDatabase
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary border-border'
                } disabled:opacity-50`}
              >
                <Database size={9} />
                {db}
              </Button>
            ))}
          </Flex>
        )}

        <Flex align="center" gap="xs" className="relative">
          <Text size="xs" color="muted" className="text-[10px]">Schema:</Text>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowSchemaPicker(!showSchemaPicker)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors h-auto border-0 p-0"
          >
            <Layers size={10} />
            <Text size="xs" truncate className="max-w-24">{activeSchema}</Text>
            {schemaList.length > 1 && <ChevronDown size={10} />}
          </Button>
          {showSchemaPicker && schemaList.length > 1 && (
            <>
              <Box className="fixed inset-0 z-40" onClick={() => setShowSchemaPicker(false)} />
              <ScrollArea direction="vertical" className="absolute top-full left-0 mt-1 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl min-w-32 py-1 max-h-48">
                {schemaList.map(s => (
                  <Button
                    key={s}
                    variant="ghost"
                    size="xs"
                    onClick={() => { onSchemaChange(s); setShowSchemaPicker(false) }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors rounded-none border-0 h-auto ${
                      activeSchema === s ? 'text-accent' : 'text-text-secondary'
                    }`}
                  >
                    <Layers size={10} className="shrink-0" />
                    {s}
                  </Button>
                ))}
              </ScrollArea>
            </>
          )}
        </Flex>
      </Box>
    </AccordionSection>
  )
}
