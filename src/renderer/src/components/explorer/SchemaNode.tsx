import { useEffect } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, RefreshCw } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/Button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { TableNode } from './TableNode'
import { ViewNode } from './ViewNode'

interface SchemaNodeProps {
  schemaName: string
  connectionId: string
  databaseName?: string
  depth: number
  onExportTable?: (tableName: string) => void
}

export function SchemaNode({ schemaName, connectionId, databaseName, depth, onExportTable }: SchemaNodeProps) {
  const nodeKey = databaseName
    ? `schema:${connectionId}:${databaseName}:${schemaName}`
    : `schema:${connectionId}:${schemaName}`
  const tableCacheKey = databaseName
    ? `${connectionId}:${databaseName}:${schemaName}`
    : `${connectionId}:${schemaName}`

  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const isExpanded = expandedTreeNodes.has(nodeKey)

  const tables = useSchemaStore((s) => s.tables)
  const filterText = useSchemaStore((s) => s.filterText)
  const switchDatabase = useSchemaStore((s) => s.switchDatabase)
  const fetchTables = useSchemaStore((s) => s.fetchTables)
  const clearCache = useSchemaStore((s) => s.clearCache)

  const addToast = useToastStore((s) => s.addToast)

  const allTables = tables.get(tableCacheKey) ?? []

  // Fetch on mount if already expanded and cache is empty
  useEffect(() => {
    if (!isExpanded || allTables.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        if (databaseName) await switchDatabase(connectionId, databaseName)
        if (!cancelled) await fetchTables(connectionId, schemaName)
      } catch { /* handled by store */ }
    })()
    return () => { cancelled = true }
  }, [isExpanded, connectionId, databaseName, schemaName]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle() {
    toggleTreeNode(nodeKey)
    if (!isExpanded) {
      try {
        if (databaseName) await switchDatabase(connectionId, databaseName)
        await fetchTables(connectionId, schemaName)
      } catch { /* handled by store */ }
    }
  }

  async function handleRefresh() {
    try {
      if (databaseName) await switchDatabase(connectionId, databaseName)
      clearCache(connectionId)
      await fetchTables(connectionId, schemaName)
      addToast({ type: 'success', title: 'Schema refreshed' })
    } catch {
      addToast({ type: 'error', title: 'Failed to refresh schema' })
    }
  }

  function handleCopySchemaName() {
    navigator.clipboard.writeText(schemaName).then(() => {
      addToast({ type: 'success', title: 'Copied schema name' })
    })
  }

  const menuItems = [
    { label: 'Refresh', onSelect: handleRefresh },
    { label: 'Copy schema name', onSelect: handleCopySchemaName },
  ]

  const filter = filterText.toLowerCase()
  const filteredTables = allTables.filter(
    (t) => t.type === 'table' && t.name.toLowerCase().includes(filter)
  )
  const filteredViews = allTables.filter(
    (t) => t.type === 'view' && t.name.toLowerCase().includes(filter)
  )

  const paddingLeft = 8 + depth * 16
  // Group label indent: align with icon content (chevron 12px + gap 6px + folder 14px + gap 6px = 38px offset from paddingLeft)
  const groupLabelPaddingLeft = paddingLeft + 28

  const chevron = isExpanded ? (
    <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  ) : (
    <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  )

  return (
    <ContextMenu items={menuItems}>
      <div>
        {/* Header row */}
        <button
          className="group w-full flex items-center gap-1.5 rounded text-left transition-colors duration-[var(--transition-fast)]"
          style={{ paddingLeft, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          onClick={handleToggle}
        >
          {chevron}
          <FolderOpen
            size={14}
            style={{ color: 'var(--color-warning)', flexShrink: 0 }}
          />
          <span
            className="flex-1 truncate min-w-0 text-xs font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {schemaName}
          </span>

          {/* Hover action: refresh */}
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
          >
            <Tooltip content="Refresh schema" side="top">
              <IconButton
                label="Refresh schema"
                size="xs"
                variant="ghost"
                className="h-5 w-5"
                tabIndex={-1}
              >
                <RefreshCw size={10} />
              </IconButton>
            </Tooltip>
          </span>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div>
            {allTables.length === 0 ? (
              <p
                className="py-1 text-xs"
                style={{ paddingLeft: groupLabelPaddingLeft, color: 'var(--color-text-tertiary)' }}
              >
                Loading…
              </p>
            ) : filteredTables.length === 0 && filteredViews.length === 0 ? (
              <p
                className="py-1 text-xs"
                style={{ paddingLeft: groupLabelPaddingLeft, color: 'var(--color-text-tertiary)' }}
              >
                No matches
              </p>
            ) : (
              <>
                {filteredTables.length > 0 && (
                  <div>
                    <p
                      className="uppercase tracking-wider opacity-40 px-2 py-1 text-xs"
                      style={{ paddingLeft: groupLabelPaddingLeft }}
                    >
                      Tables
                    </p>
                    {filteredTables.map((t) => (
                      <TableNode
                        key={t.name}
                        tableName={t.name}
                        connectionId={connectionId}
                        schema={schemaName}
                        depth={depth + 1}
                        onExportTable={onExportTable}
                      />
                    ))}
                  </div>
                )}

                {filteredViews.length > 0 && (
                  <div>
                    <p
                      className="uppercase tracking-wider opacity-40 px-2 py-1 text-xs"
                      style={{ paddingLeft: groupLabelPaddingLeft }}
                    >
                      Views
                    </p>
                    {filteredViews.map((v) => (
                      <ViewNode
                        key={v.name}
                        viewName={v.name}
                        connectionId={connectionId}
                        schema={schemaName}
                        depth={depth + 1}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}
