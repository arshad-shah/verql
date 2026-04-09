import { useEffect } from 'react'
import { ChevronRight, ChevronDown, Database, RefreshCw } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/Button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { SchemaNode } from './SchemaNode'

interface DatabaseNodeProps {
  databaseName: string
  connectionId: string
  depth: number
  onExportTable?: (tableName: string) => void
}

export function DatabaseNode({
  databaseName,
  connectionId,
  depth,
  onExportTable,
}: DatabaseNodeProps) {
  const nodeKey = `db:${connectionId}:${databaseName}`

  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const isExpanded = expandedTreeNodes.has(nodeKey)

  const schemas = useSchemaStore((s) => s.schemas)
  const fetchSchemas = useSchemaStore((s) => s.fetchSchemas)
  const clearCache = useSchemaStore((s) => s.clearCache)

  const addToast = useToastStore((s) => s.addToast)

  const schemaList = schemas.get(connectionId) ?? []

  // Fetch on mount if already expanded and cache is empty
  useEffect(() => {
    if (isExpanded && schemaList.length === 0) {
      fetchSchemas(connectionId)
    }
  }, [isExpanded, connectionId, fetchSchemas, schemaList.length])

  function handleToggle() {
    toggleTreeNode(nodeKey)
    if (!isExpanded) {
      fetchSchemas(connectionId)
    }
  }

  function handleRefresh() {
    clearCache(connectionId)
    fetchSchemas(connectionId)
    addToast({ type: 'success', title: `Refreshed ${databaseName}` })
  }

  function handleCopyName() {
    navigator.clipboard.writeText(databaseName).then(() => {
      addToast({ type: 'success', title: 'Copied database name' })
    })
  }

  const menuItems = [
    {
      label: 'Refresh',
      onSelect: handleRefresh,
    },
    {
      label: 'Copy database name',
      onSelect: handleCopyName,
    },
  ]

  const paddingLeft = 8 + depth * 16

  const chevron = isExpanded ? (
    <ChevronDown size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  ) : (
    <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
  )

  return (
    <ContextMenu items={menuItems}>
      <div>
        {/* Header row */}
        <div
          className="group flex items-center gap-1.5 h-7 rounded cursor-pointer select-none min-w-0 pr-1"
          style={{ paddingLeft }}
          onClick={handleToggle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          {chevron}
          <Database
            size={14}
            style={{ color: 'var(--color-info)', flexShrink: 0 }}
          />
          <span
            className="flex-1 truncate min-w-0 text-xs font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {databaseName}
          </span>

          {/* Hover action: refresh */}
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
          >
            <Tooltip content="Refresh" side="top">
              <IconButton
                label="Refresh database"
                size="xs"
                variant="ghost"
                className="h-5 w-5"
                tabIndex={-1}
              >
                <RefreshCw size={10} />
              </IconButton>
            </Tooltip>
          </span>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div>
            {schemaList.length === 0 ? (
              <p
                className="text-xs px-3 py-1"
                style={{
                  paddingLeft: paddingLeft + 20,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Loading…
              </p>
            ) : (
              schemaList.map((schemaName) => (
                <SchemaNode
                  key={schemaName}
                  schemaName={schemaName}
                  connectionId={connectionId}
                  depth={depth + 1}
                  onExportTable={onExportTable}
                />
              ))
            )}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}
