import { useEffect } from 'react'
import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { TableIcon, ColumnIcon } from '@/components/explorer/icons'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'

interface ViewsSectionProps {
  connectionId: string
  activeSchema: string
}

export function ViewsSection({ connectionId, activeSchema }: ViewsSectionProps) {
  const { tables, columns, expandedTables, filterText, cacheVersion, fetchTables, fetchColumns, toggleTable } = useSchemaStore()
  const expanded = useUiStore((s) => s.expandedSections['VIEWS'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { addQueryTab, updateTabSql } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const viewList = allTables.filter(t => t.type === 'view')
  const filtered = filterText
    ? viewList.filter(v => v.name.toLowerCase().includes(filterText.toLowerCase()))
    : viewList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, cacheVersion, fetchTables])

  const handleExpandView = async (viewName: string) => {
    const key = `${connectionId}:${activeSchema}:${viewName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, viewName, activeSchema)
    }
  }

  const getMenuItems = (viewName: string) => [
    {
      label: 'Copy name',
      onSelect: () => {
        navigator.clipboard.writeText(viewName)
        addToast({ type: 'success', title: 'Copied view name' })
      },
    },
    {
      label: 'Copy SELECT',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      },
    },
    {
      label: 'Open in tab',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      },
    },
  ]

  if (viewList.length === 0 && !filterText) return null

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('VIEWS')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">VIEWS</Text>
          <Badge size="sm">{filtered.length}</Badge>
        </Accordion.Trigger>
        <Accordion.Content>
          <Box className="px-1">
            {filtered.length === 0 && (
              <Text size="xs" color="muted" as="p" className="px-2 py-3 text-center">
                {filterText ? 'No matching views' : 'No views found'}
              </Text>
            )}
            {filtered.map(view => {
              const colKey = `${connectionId}:${activeSchema}:${view.name}`
              const isExpanded = expandedTables.has(colKey)
              const cols = columns.get(colKey) ?? []

              return (
                <ContextMenu key={view.name} items={getMenuItems(view.name)}>
                  <TreeItem
                    label={view.name}
                    icon={<TableIcon type="view" />}
                    depth={0}
                    expanded={isExpanded}
                    onToggle={() => handleExpandView(view.name)}
                    actions={
                      <DropdownMenu
                        trigger={
                          <IconButton label="More actions" size="xs" variant="ghost" className="text-text-muted hover:text-text-primary">
                            <MoreHorizontal size={12} />
                          </IconButton>
                        }
                        items={getMenuItems(view.name)}
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
