import { ChevronRight, ChevronDown, Eye, ExternalLink } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/Button'
import { ColumnRow } from './ColumnRow'
import { HighlightedText } from './HighlightedText'

interface ViewNodeProps {
  viewName: string
  connectionId: string
  schema: string
  depth: number
  highlightQuery?: string
}

export function ViewNode({ viewName, connectionId, schema, depth, highlightQuery }: ViewNodeProps) {
  const expandedTreeNodes = useUiStore((s) => s.expandedTreeNodes)
  const toggleTreeNode = useUiStore((s) => s.toggleTreeNode)
  const columns = useSchemaStore((s) => s.columns)
  const fetchColumns = useSchemaStore((s) => s.fetchColumns)
  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const addToast = useToastStore((s) => s.addToast)

  const nodeKey = `view:${connectionId}:${schema}:${viewName}`
  const colCacheKey = `${connectionId}:${schema}:${viewName}`
  const isExpanded = expandedTreeNodes.has(nodeKey)
  const cols = columns.get(colCacheKey) ?? []

  async function getSampleQuery(): Promise<string> {
    try {
      return await window.electronAPI.invoke('db:sample-query', connectionId, viewName, schema) as string
    } catch {
      return `SELECT * FROM "${viewName}" LIMIT 100;`
    }
  }

  function handleToggle() {
    toggleTreeNode(nodeKey)
    if (!isExpanded) {
      fetchColumns(connectionId, viewName, schema)
    }
  }

  async function handleOpenInTab() {
    const query = await getSampleQuery()
    const tabId = addQueryTab(connectionId, schema)
    updateTabSql(tabId, query)
  }

  const menuItems = [
    {
      label: 'Open in query tab',
      onSelect: handleOpenInTab,
    },
    {
      label: 'Copy view name',
      onSelect: () => {
        navigator.clipboard.writeText(viewName).then(() => {
          addToast({ type: 'success', title: 'Copied view name' })
        })
      },
    },
    {
      label: 'Copy sample query',
      onSelect: async () => {
        const query = await getSampleQuery()
        navigator.clipboard.writeText(query).then(() => {
          addToast({ type: 'success', title: 'Copied sample query' })
        })
      },
    },
  ]

  const paddingLeft = 8 + depth * 16

  if (!isExpanded) {
    return (
      <ContextMenu items={menuItems}>
        <div
          className="group flex items-center gap-1 h-7 rounded cursor-pointer select-none min-w-0 pr-1"
          style={{ paddingLeft }}
          onClick={handleToggle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <ChevronRight
            size={12}
            style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
          />
          <Eye
            size={14}
            style={{ color: 'var(--color-info)', flexShrink: 0 }}
          />
          <span
            className="flex-1 truncate min-w-0 text-xs"
            style={{ color: 'var(--color-text-primary)' }}
            title={viewName}
          >
            <HighlightedText text={viewName} query={highlightQuery ?? ''} />
          </span>
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              label="Open in query tab"
              size="xs"
              variant="ghost"
              className="h-5 w-5"
              onClick={handleOpenInTab}
            >
              <ExternalLink size={10} />
            </IconButton>
          </span>
        </div>
      </ContextMenu>
    )
  }

  // Expanded: contained card
  return (
    <ContextMenu items={menuItems}>
      <div
        className="rounded my-0.5 overflow-hidden"
        style={{
          marginLeft: paddingLeft,
          marginRight: 4,
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-secondary)',
        }}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-1 h-7 px-2 cursor-pointer select-none"
          style={{ background: 'var(--color-bg-tertiary)' }}
          onClick={handleToggle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
        >
          <ChevronDown
            size={12}
            style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}
          />
          <Eye
            size={14}
            style={{ color: 'var(--color-info)', flexShrink: 0 }}
          />
          <span
            className="flex-1 truncate min-w-0 text-xs font-medium"
            style={{ color: 'var(--color-text-primary)' }}
            title={viewName}
          >
            <HighlightedText text={viewName} query={highlightQuery ?? ''} />
          </span>
        </div>

        {/* Column rows */}
        <div className="py-0.5">
          {cols.length === 0 ? (
            <p
              className="text-xs px-2 py-1.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Loading columns…
            </p>
          ) : (
            cols.map((col) => (
              <ColumnRow key={col.name} column={col} tableName={viewName} />
            ))
          )}
        </div>
      </div>
    </ContextMenu>
  )
}
