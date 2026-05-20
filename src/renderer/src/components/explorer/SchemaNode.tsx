import { useEffect } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, RefreshCw, GitFork, Layers, FunctionSquare, Workflow, Zap, Hash } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
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
  const objects = useSchemaStore((s) => s.objects)
  const filterText = useSchemaStore((s) => s.filterText)
  const switchDatabase = useSchemaStore((s) => s.switchDatabase)
  const fetchTables = useSchemaStore((s) => s.fetchTables)
  const fetchSchemaObjects = useSchemaStore((s) => s.fetchSchemaObjects)
  const clearCache = useSchemaStore((s) => s.clearCache)

  const openErDiagram = useTabsStore((s) => s.openErDiagram)
  const addToast = useToastStore((s) => s.addToast)

  const allTables = tables.get(tableCacheKey) ?? []
  const allObjects = objects.get(tableCacheKey) ?? []

  const loadAll = async () => {
    if (databaseName) await switchDatabase(connectionId, databaseName)
    await Promise.all([
      fetchTables(connectionId, schemaName, databaseName),
      fetchSchemaObjects(connectionId, schemaName, databaseName)
    ])
  }

  useEffect(() => {
    if (!isExpanded || allTables.length > 0) return
    let cancelled = false
    ;(async () => {
      try { if (!cancelled) await loadAll() } catch { /* handled by store */ }
    })()
    return () => { cancelled = true }
  }, [isExpanded, connectionId, databaseName, schemaName]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle() {
    toggleTreeNode(nodeKey)
    if (!isExpanded) {
      try { await loadAll() } catch { /* handled by store */ }
    }
  }

  async function handleRefresh() {
    try {
      clearCache(connectionId)
      await loadAll()
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
    { label: 'Open ER Diagram', onSelect: () => openErDiagram(connectionId, schemaName) },
    { label: 'Refresh', onSelect: handleRefresh },
    { label: 'Copy schema name', onSelect: handleCopySchemaName },
  ]

  const filter = filterText.toLowerCase()
  const matches = (name: string) => name.toLowerCase().includes(filter)
  const filteredTables = allTables.filter((t) => t.type === 'table' && matches(t.name))
  const filteredViews = allTables.filter((t) => t.type === 'view' && matches(t.name))
  const matViews = allObjects.filter((o) => o.kind === 'materialized_view' && matches(o.name))
  const functions = allObjects.filter((o) => o.kind === 'function' && matches(o.name))
  const procedures = allObjects.filter((o) => o.kind === 'procedure' && matches(o.name))
  const triggers = allObjects.filter((o) => o.kind === 'trigger' && matches(o.name))
  const sequences = allObjects.filter((o) => o.kind === 'sequence' && matches(o.name))

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

          {/* Hover actions */}
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
          >
            <span onClick={(e) => { e.stopPropagation(); openErDiagram(connectionId, schemaName) }}>
              <Tooltip content="ER Diagram" side="top">
                <IconButton
                  label="ER Diagram"
                  size="xs"
                  variant="ghost"
                  className="h-5 w-5"
                  tabIndex={-1}
                >
                  <GitFork size={10} />
                </IconButton>
              </Tooltip>
            </span>
            <span onClick={(e) => { e.stopPropagation(); handleRefresh() }}>
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

                <SchemaObjectGroup
                  label="Materialized Views"
                  items={matViews.map((o) => ({ key: o.name, label: o.name }))}
                  icon={<Layers size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                  groupLabelPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={paddingLeft + 28}
                />
                <SchemaObjectGroup
                  label="Functions"
                  items={functions.map((o) => ({
                    key: `${o.name}${o.signature ?? ''}`,
                    label: `${o.name}${o.signature ?? ''}`,
                    sub: o.returnType ? `→ ${o.returnType}` : undefined,
                  }))}
                  icon={<FunctionSquare size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                  groupLabelPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={paddingLeft + 28}
                />
                <SchemaObjectGroup
                  label="Procedures"
                  items={procedures.map((o) => ({
                    key: `${o.name}${o.signature ?? ''}`,
                    label: `${o.name}${o.signature ?? ''}`,
                  }))}
                  icon={<Workflow size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                  groupLabelPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={paddingLeft + 28}
                />
                <SchemaObjectGroup
                  label="Triggers"
                  items={triggers.map((o) => ({
                    key: o.name,
                    label: o.name,
                    sub: o.parent ? `on ${o.parent}` : undefined,
                  }))}
                  icon={<Zap size={12} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
                  groupLabelPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={paddingLeft + 28}
                />
                <SchemaObjectGroup
                  label="Sequences"
                  items={sequences.map((o) => ({ key: o.name, label: o.name }))}
                  icon={<Hash size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                  groupLabelPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={paddingLeft + 28}
                />
              </>
            )}
          </div>
        )}
      </div>
    </ContextMenu>
  )
}

interface SchemaObjectGroupItem {
  key: string
  label: string
  sub?: string
}

function SchemaObjectGroup({
  label,
  items,
  icon,
  groupLabelPaddingLeft,
  itemPaddingLeft,
}: {
  label: string
  items: SchemaObjectGroupItem[]
  icon: React.ReactNode
  groupLabelPaddingLeft: number
  itemPaddingLeft: number
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p
        className="uppercase tracking-wider opacity-40 px-2 py-1 text-xs"
        style={{ paddingLeft: groupLabelPaddingLeft }}
      >
        {label}
      </p>
      {items.map((it) => (
        <div
          key={it.key}
          className="flex items-center gap-1.5 text-xs py-0.5 truncate"
          style={{ paddingLeft: itemPaddingLeft, color: 'var(--color-text-secondary)' }}
          title={it.sub ? `${it.label} ${it.sub}` : it.label}
        >
          {icon}
          <span className="truncate">{it.label}</span>
          {it.sub && (
            <span className="opacity-50 truncate" style={{ fontStyle: 'italic' }}>
              {it.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
