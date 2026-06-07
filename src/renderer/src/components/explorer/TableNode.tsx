import { useEffect } from 'react'
import { ChevronRight, ChevronDown, Table2 } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { ColumnRow } from './ColumnRow'
import { HighlightedText } from './HighlightedText'
import { TableHoverActions } from './TableHoverActions'
import { useTableNodeActions } from './useTableNodeActions'
import { useTranslation } from '@/i18n/I18nProvider'

interface TableNodeProps {
  tableName: string
  connectionId: string
  schema: string
  depth: number
  onExportTable?: (tableName: string) => void
  highlightQuery?: string
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
  highlightQuery,
}: TableNodeProps) {
  const { t } = useTranslation()
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

  const { canViewData, openData, openInQueryTab, copySampleQuery, menuItems } =
    useTableNodeActions(connectionId, tableName, schema, onExportTable)

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
            title={tableName}
          >
            <HighlightedText text={tableName} query={highlightQuery ?? ''} />
          </span>
          {rowCountDisplay}

          <TableHoverActions
            canViewData={canViewData}
            onViewData={openData}
            onOpenInQueryTab={openInQueryTab}
            onCopySampleQuery={copySampleQuery}
          />
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
            title={tableName}
          >
            <HighlightedText text={tableName} query={highlightQuery ?? ''} />
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
                {t('explorer.table.rows', { value: formatRowCount(rowCount), n: rowCount })}
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
                {t('explorer.table.indexes', { value: tableIndexes.length, n: tableIndexes.length })}
              </span>
            )}
          </span>

          <TableHoverActions
            canViewData={canViewData}
            onViewData={openData}
            onOpenInQueryTab={openInQueryTab}
            onExportTable={onExportTable ? () => onExportTable(tableName) : undefined}
          />
        </button>

        {/* Column rows */}
        <div className="py-1">
          {tableColumns.length === 0 ? (
            <p
              className="px-3 py-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {/* Distinguish "loaded, but this driver has no columns" (e.g. Redis)
                  from "still fetching" — otherwise schema-less drivers show a
                  perpetual "Loading columns…". */}
              {columns.has(cacheKey) ? t('explorer.noColumns') : t('explorer.loading.columns')}
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
