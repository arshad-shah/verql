import { useEffect } from 'react'
import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { TableIcon, ColumnIcon } from '@/components/explorer/icons'
import { formatRowCount } from '@/lib/format'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'

interface TablesSectionProps {
  connectionId: string
  activeSchema: string
  onExportTable: (tableName: string) => void
}

export function TablesSection({ connectionId, activeSchema, onExportTable }: TablesSectionProps) {
  const { tables, columns, expandedTables, rowCounts, filterText, cacheVersion, fetchTables, fetchColumns, fetchRowCount, toggleTable } = useSchemaStore()
  const expanded = useUiStore((s) => s.expandedSections['TABLES'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { addQueryTab, updateTabSql } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const tableList = allTables.filter(t => t.type === 'table')
  const filtered = filterText
    ? tableList.filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()))
    : tableList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, cacheVersion, fetchTables])

  useEffect(() => {
    filtered.forEach(t => {
      fetchRowCount(connectionId, t.name, activeSchema)
    })
  }, [connectionId, activeSchema, filtered.length, fetchRowCount])

  const handleExpandTable = async (tableName: string) => {
    const key = `${connectionId}:${activeSchema}:${tableName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, tableName, activeSchema)
    }
  }

  const getMenuItems = (tableName: string) => [
    {
      label: 'Export',
      onSelect: () => onExportTable(tableName),
    },
    {
      label: 'Copy name',
      onSelect: () => {
        navigator.clipboard.writeText(tableName)
        addToast({ type: 'success', title: 'Copied table name' })
      },
    },
    {
      label: 'Copy SELECT',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      },
    },
    {
      label: 'Open in tab',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      },
    },
  ]

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('TABLES')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">TABLES</Text>
          <Badge size="sm">{filtered.length}</Badge>
        </Accordion.Trigger>
        <Accordion.Content>
          <Box className="px-1">
            {filtered.length === 0 && (
              <Text size="xs" color="muted" as="p" className="px-2 py-3 text-center">
                {filterText ? 'No matching tables' : 'No tables found'}
              </Text>
            )}
            {filtered.map(table => {
              const colKey = `${connectionId}:${activeSchema}:${table.name}`
              const isExpanded = expandedTables.has(colKey)
              const cols = columns.get(colKey) ?? []
              const count = rowCounts.get(colKey)

              return (
                <ContextMenu key={table.name} items={getMenuItems(table.name)}>
                  <TreeItem
                    label={table.name}
                    icon={<TableIcon type="table" />}
                    depth={0}
                    expanded={isExpanded}
                    onToggle={() => handleExpandTable(table.name)}
                    meta={count !== undefined ? formatRowCount(count) : undefined}
                    actions={
                      <DropdownMenu
                        trigger={
                          <IconButton label="More actions" size="xs" variant="ghost" className="text-text-muted hover:text-text-primary">
                            <MoreHorizontal size={12} />
                          </IconButton>
                        }
                        items={getMenuItems(table.name)}
                      />
                    }
                  >
                    {cols.map(col => (
                      <TreeItem
                        key={col.name}
                        label={`${col.name} ${col.dataType}`}
                        icon={<ColumnIcon column={col} />}
                        depth={1}
                        meta={
                          col.isForeignKey && col.references
                            ? <span className="inline-flex items-center gap-0.5"><ArrowRight size={9} />{col.references.table}.{col.references.column}</span>
                            : undefined
                        }
                      />
                    ))}
                  </TreeItem>
                </ContextMenu>
              )
            })}
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
