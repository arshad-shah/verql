import { useEffect } from 'react'
import { ChevronRight, ChevronDown, Table2, ExternalLink, Play, Download } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { usePluginContextMenuItems } from '@/components/plugin-ui/usePluginContextMenu'
import { IconButton } from '@/primitives/forms/Button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { ColumnRow } from './ColumnRow'

interface TableNodeProps {
  tableName: string
  connectionId: string
  schema: string
  depth: number
  onExportTable?: (tableName: string) => void
}

function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}

export function TableNode({
  tableName,
  connectionId,
  schema,
  depth,
  onExportTable,
}: TableNodeProps) {
  const nodeKey = `table:${connectionId}:${schema}:${tableName}`
  const cacheKey = `${connectionId}:${schema}:${tableName}`

  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const isExpanded = expandedTreeNodes.has(nodeKey)

  const columns = useSchemaStore((s) => s.columns)
  const indexes = useSchemaStore((s) => s.indexes)
  const rowCounts = useSchemaStore((s) => s.rowCounts)
  const fetchColumns = useSchemaStore((s) => s.fetchColumns)
  const fetchIndexes = useSchemaStore((s) => s.fetchIndexes)
  const fetchRowCount = useSchemaStore((s) => s.fetchRowCount)

  const tableColumns = columns.get(cacheKey) ?? []
  const tableIndexes = indexes.get(cacheKey) ?? []
  const rowCount = rowCounts.get(cacheKey)

  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const addToast = useToastStore((s) => s.addToast)
  const pluginTableItems = usePluginContextMenuItems('table')

  // Lazy-fetch when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchColumns(connectionId, tableName, schema)
      fetchIndexes(connectionId, tableName, schema)
      fetchRowCount(connectionId, tableName, schema)
    }
  }, [isExpanded, connectionId, tableName, schema, fetchColumns, fetchIndexes, fetchRowCount])

  function handleToggle() {
    toggleTreeNode(nodeKey)
  }

  function openInQueryTab() {
    const sql = `SELECT * FROM ${tableName} LIMIT 100;`
    const tabId = addQueryTab(connectionId, schema)
    updateTabSql(tabId, sql)
  }

  function copyTableName() {
    navigator.clipboard.writeText(tableName).then(() => {
      addToast({ type: 'success', title: 'Copied table name' })
    })
  }

  function copySelectStar() {
    const sql = `SELECT * FROM ${tableName} LIMIT 100;`
    navigator.clipboard.writeText(sql).then(() => {
      addToast({ type: 'success', title: 'Copied SELECT *' })
    })
  }

  const menuItems = [
    {
      label: 'Open in query tab',
      onSelect: openInQueryTab,
    },
    {
      label: 'Copy table name',
      onSelect: copyTableName,
    },
    {
      label: 'Copy SELECT *',
      onSelect: copySelectStar,
    },
    ...(onExportTable
      ? [
          {
            label: 'Export table',
            onSelect: () => onExportTable(tableName),
          },
        ]
      : []),
    ...pluginTableItems,
  ]

  const paddingLeft = 8 + depth * 16

  // ── Shared header content ──────────────────────────────────────────────────

  const chevron = isExpanded ? (
    <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  ) : (
    <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  )

  const rowCountDisplay =
    rowCount !== undefined ? (
      <span
        className="text-xs shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {formatRowCount(rowCount)}
      </span>
    ) : null

  // ── Collapsed view ─────────────────────────────────────────────────────────

  if (!isExpanded) {
    return (
      <ContextMenu items={menuItems}>
        <button
          className="group w-full flex items-center gap-1.5 rounded text-left transition-colors duration-[var(--transition-fast)]"
          style={{ paddingLeft, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          onClick={handleToggle}
        >
          {chevron}
          <Table2 size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span
            className="flex-1 truncate min-w-0 text-xs"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {tableName}
          </span>
          {rowCountDisplay}

          {/* Hover actions */}
          <span
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip content="Open in new tab" side="top">
              <IconButton
                label="Open in query tab"
                size="xs"
                variant="ghost"
                className="h-5 w-5"
                onClick={openInQueryTab}
              >
                <ExternalLink size={10} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Copy SELECT *" side="top">
              <IconButton
                label="Copy SELECT *"
                size="xs"
                variant="ghost"
                className="h-5 w-5"
                onClick={copySelectStar}
              >
                <Play size={10} />
              </IconButton>
            </Tooltip>
          </span>
        </button>
      </ContextMenu>
    )
  }

  // ── Expanded view (contained card) ─────────────────────────────────────────

  return (
    <ContextMenu items={menuItems}>
      <div
        className="mb-1 rounded-lg overflow-hidden"
        style={{
          marginLeft: paddingLeft,
          marginRight: 4,
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-secondary)',
        }}
      >
        {/* Card header button */}
        <button
          className="group w-full flex items-center gap-1.5 text-left transition-colors duration-[var(--transition-fast)]"
          style={{
            paddingLeft: 8,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
            background: 'var(--color-bg-tertiary)',
            borderBottom: '1px solid var(--color-border-default)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-hover) 60%, var(--color-bg-tertiary))')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'var(--color-bg-tertiary)')
          }
          onClick={handleToggle}
        >
          {chevron}
          <Table2 size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span
            className="flex-1 truncate min-w-0 text-xs font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {tableName}
          </span>

          {/* Stat pills */}
          <span className="flex items-center gap-1 shrink-0">
            {rowCount !== undefined && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {formatRowCount(rowCount)} rows
              </span>
            )}
            {tableIndexes.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {tableIndexes.length} idx
              </span>
            )}
          </span>

          {/* Hover actions */}
          <span
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip content="Open in new tab" side="top">
              <IconButton
                label="Open in query tab"
                size="xs"
                variant="ghost"
                className="h-5 w-5"
                onClick={openInQueryTab}
              >
                <ExternalLink size={10} />
              </IconButton>
            </Tooltip>
            {onExportTable && (
              <Tooltip content="Export table" side="top">
                <IconButton
                  label="Export table"
                  size="xs"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => onExportTable(tableName)}
                >
                  <Download size={10} />
                </IconButton>
              </Tooltip>
            )}
          </span>
        </button>

        {/* Column rows */}
        <div className="py-1">
          {tableColumns.length === 0 ? (
            <p
              className="px-3 py-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Loading columns…
            </p>
          ) : (
            tableColumns.map((col) => (
              <ColumnRow key={col.name} column={col} tableName={tableName} />
            ))
          )}
        </div>
      </div>
    </ContextMenu>
  )
}
