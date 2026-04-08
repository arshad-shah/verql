import { useEffect } from 'react'
import { Download, Copy, PenSquare } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { SchemaTreeItem, TableIcon, ColumnIcon, formatRowCount } from '@/components/schema/SchemaTreeItem'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'
import { Text, Box } from '@/primitives'

interface TablesSectionProps {
  connectionId: string
  activeSchema: string
  onExportTable: (tableName: string) => void
}

export function TablesSection({ connectionId, activeSchema, onExportTable }: TablesSectionProps) {
  const { tables, columns, expandedTables, rowCounts, filterText, cacheVersion, fetchTables, fetchColumns, fetchRowCount, toggleTable } = useSchemaStore()
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

  // Fetch row counts for visible tables
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

  const getOverflowItems = (tableName: string): MenuItem[] => [
    {
      label: 'Export',
      icon: <Download size={12} />,
      onClick: () => onExportTable(tableName)
    },
    {
      label: 'Copy name',
      icon: <Copy size={12} />,
      onClick: () => {
        navigator.clipboard.writeText(tableName)
        addToast({ type: 'success', title: 'Copied table name' })
      }
    },
    {
      label: 'Copy SELECT',
      icon: <Copy size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      }
    },
    {
      label: 'Open in tab',
      icon: <PenSquare size={12} />,
      onClick: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      }
    }
  ]

  return (
    <AccordionSection title="TABLES" count={filtered.length}>
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
            <SchemaTreeItem
              key={table.name}
              label={table.name}
              icon={<TableIcon type="table" />}
              depth={0}
              expanded={isExpanded}
              onToggle={() => handleExpandTable(table.name)}
              meta={count !== undefined ? formatRowCount(count) : undefined}
              actions={<OverflowMenu items={getOverflowItems(table.name)} />}
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
