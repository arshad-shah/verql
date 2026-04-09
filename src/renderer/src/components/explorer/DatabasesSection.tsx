import { useEffect, useState } from 'react'
import { RefreshCw, Database, GitFork } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { Accordion, IconButton, Text, Box, Flex, Button, Select, Badge } from '@/primitives'

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
  const expanded = useUiStore((s) => s.expandedSections['DATABASES'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { openErDiagram } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)

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

  if (isSqlite && databaseList.length <= 1 && schemaList.length <= 1) return null

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('DATABASES')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">DATABASES</Text>
          {databaseList.length > 0 && <Badge size="sm">{databaseList.length}</Badge>}
          <Accordion.Actions>
            <IconButton
              label="ER Diagram"
              size="xs"
              variant="ghost"
              onClick={() => openErDiagram(connectionId, activeSchema)}
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
          </Accordion.Actions>
        </Accordion.Trigger>
        <Accordion.Content>
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
                        : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary border-border-default'
                    } disabled:opacity-50`}
                  >
                    <Database size={9} />
                    {db}
                  </Button>
                ))}
              </Flex>
            )}

            {schemaList.length > 1 && (
              <Flex align="center" gap="xs">
                <Text size="xs" color="muted" className="text-[10px]">Schema:</Text>
                <Select
                  size="xs"
                  value={activeSchema}
                  onChange={(v) => onSchemaChange(v)}
                  options={schemaList.map(s => ({ value: s, label: s }))}
                  className="max-w-32"
                />
              </Flex>
            )}

            {schemaList.length <= 1 && (
              <Flex align="center" gap="xs">
                <Text size="xs" color="muted" className="text-[10px]">Schema:</Text>
                <Text size="xs" color="secondary">{activeSchema}</Text>
              </Flex>
            )}
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
