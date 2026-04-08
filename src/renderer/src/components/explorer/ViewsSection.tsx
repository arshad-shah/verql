import { useEffect } from 'react'
import { Copy, PenSquare } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { SchemaTreeItem, TableIcon, ColumnIcon } from '@/components/schema/SchemaTreeItem'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'
import { Text, Box } from '@/primitives'

interface ViewsSectionProps {
  connectionId: string
  activeSchema: string
}

export function ViewsSection({ connectionId, activeSchema }: ViewsSectionProps) {
  const { tables, columns, expandedTables, filterText, cacheVersion, fetchTables, fetchColumns, toggleTable } = useSchemaStore()
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

  const getOverflowItems = (viewName: string): MenuItem[] => [
    {
      label: 'Copy name',
      icon: <Copy size={12} />,
      onClick: () => {
        navigator.clipboard.writeText(viewName)
        addToast({ type: 'success', title: 'Copied view name' })
      }
    },
    {
      label: 'Copy SELECT',
      icon: <Copy size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      }
    },
    {
      label: 'Open in tab',
      icon: <PenSquare size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      }
    }
  ]

  if (viewList.length === 0 && !filterText) return null

  return (
    <AccordionSection title="VIEWS" count={filtered.length}>
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
            <SchemaTreeItem
              key={view.name}
              label={view.name}
              icon={<TableIcon type="view" />}
              depth={0}
              expanded={isExpanded}
              onToggle={() => handleExpandView(view.name)}
              actions={<OverflowMenu items={getOverflowItems(view.name)} />}
            >
              {cols.map(col => (
                <SchemaTreeItem
                  key={col.name}
                  label={`${col.name} ${col.dataType}`}
                  icon={<ColumnIcon column={col} />}
                  depth={1}
                  meta={col.isForeignKey && col.references ? `→ ${col.references.table}.${col.references.column}` : undefined}
                />
              ))}
            </SchemaTreeItem>
          )
        })}
      </Box>
    </AccordionSection>
  )
}
