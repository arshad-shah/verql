import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, RefreshCw, GitFork, Layers, FunctionSquare, Workflow, Zap, Hash, Table2, Eye, KeySquare, Package } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { ContextMenu } from '@/primitives/surfaces/ContextMenu'
import { IconButton } from '@/primitives/forms/Button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { TableNode } from './TableNode'
import { ViewNode } from './ViewNode'
import { HighlightedText } from './HighlightedText'
import { fuzzyMatch } from '@/lib/fuzzy-match'

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

  const matches = (name: string) => !filterText || fuzzyMatch(filterText, name) !== null
  const byScore = <T extends { name: string }>(a: T, b: T) => {
    if (!filterText) return a.name.localeCompare(b.name)
    const sa = fuzzyMatch(filterText, a.name)?.score ?? 0
    const sb = fuzzyMatch(filterText, b.name)?.score ?? 0
    return sa - sb || a.name.localeCompare(b.name)
  }
  const filteredTables = allTables.filter((t) => t.type === 'table' && matches(t.name)).sort(byScore)
  const filteredViews = allTables.filter((t) => t.type === 'view' && matches(t.name)).sort(byScore)
  const matViews = allObjects.filter((o) => o.kind === 'materialized_view' && matches(o.name)).sort(byScore)
  const functions = allObjects.filter((o) => o.kind === 'function' && matches(o.name)).sort(byScore)
  const procedures = allObjects.filter((o) => o.kind === 'procedure' && matches(o.name)).sort(byScore)
  const triggers = allObjects.filter((o) => o.kind === 'trigger' && matches(o.name)).sort(byScore)
  const sequences = allObjects.filter((o) => o.kind === 'sequence' && matches(o.name)).sort(byScore)
  const indexes = allObjects.filter((o) => o.kind === 'index' && matches(o.name)).sort(byScore)
  const extensions = allObjects.filter((o) => o.kind === 'extension' && matches(o.name)).sort(byScore)

  const paddingLeft = 8 + depth * 16
  // One indent step in from the schema row, so group headers sit clearly under it.
  const groupLabelPaddingLeft = paddingLeft + 16
  // Items inside a group nest one step further in (matches TableNode/ViewNode depth+2).
  const groupItemPaddingLeft = paddingLeft + 32
  // Tables/Views rows are real TreeItems with their own chevron; depth+2 keeps
  // them visually nested under their group header instead of crashing into it.
  const childDepth = depth + 2

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
            title={schemaName}
          >
            <HighlightedText text={schemaName} query={filterText} />
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
                <SchemaGroup
                  storageKey={`${tableCacheKey}:tables`}
                  label="Tables"
                  count={filteredTables.length}
                  icon={<Table2 size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  defaultExpanded
                >
                  {filteredTables.map((t) => (
                    <TableNode
                      key={t.name}
                      tableName={t.name}
                      connectionId={connectionId}
                      schema={schemaName}
                      depth={childDepth}
                      onExportTable={onExportTable}
                      highlightQuery={filterText}
                    />
                  ))}
                </SchemaGroup>

                <SchemaGroup
                  storageKey={`${tableCacheKey}:views`}
                  label="Views"
                  count={filteredViews.length}
                  icon={<Eye size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                >
                  {filteredViews.map((v) => (
                    <ViewNode
                      key={v.name}
                      viewName={v.name}
                      connectionId={connectionId}
                      schema={schemaName}
                      depth={childDepth}
                      highlightQuery={filterText}
                    />
                  ))}
                </SchemaGroup>

                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:mvs`}
                  label="Materialized Views"
                  items={matViews.map((o) => ({ key: o.name, label: o.name }))}
                  icon={<Layers size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:indexes`}
                  label="Indexes"
                  items={indexes.map((o) => ({
                    key: `${o.parent ?? ''}.${o.name}`,
                    label: o.name,
                    sub: o.parent
                      ? `on ${o.parent}${o.returnType ? ' • ' + o.returnType : ''}`
                      : o.returnType ?? undefined
                  }))}
                  icon={<KeySquare size={12} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:functions`}
                  label="Functions"
                  items={functions.map((o) => ({
                    key: `${o.name}${o.signature ?? ''}`,
                    label: `${o.name}${o.signature ?? ''}`,
                    sub: o.returnType ? `→ ${o.returnType}` : undefined,
                  }))}
                  icon={<FunctionSquare size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:procedures`}
                  label="Procedures"
                  items={procedures.map((o) => ({
                    key: `${o.name}${o.signature ?? ''}`,
                    label: `${o.name}${o.signature ?? ''}`,
                  }))}
                  icon={<Workflow size={12} style={{ color: 'var(--color-info)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:triggers`}
                  label="Triggers"
                  items={triggers.map((o) => ({
                    key: `${o.parent ?? ''}.${o.name}`,
                    label: o.name,
                    sub: o.parent ? `on ${o.parent}` : undefined,
                  }))}
                  icon={<Zap size={12} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:sequences`}
                  label="Sequences"
                  items={sequences.map((o) => ({ key: o.name, label: o.name }))}
                  icon={<Hash size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
                />
                <SchemaObjectGroup
                  storageKey={`${tableCacheKey}:extensions`}
                  label="Extensions"
                  items={extensions.map((o) => ({ key: o.name, label: o.name }))}
                  icon={<Package size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                  headerPaddingLeft={groupLabelPaddingLeft}
                  itemPaddingLeft={groupItemPaddingLeft}
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

/**
 * Collapsible header row used by every schema sub-category. Persists its
 * expanded state in localStorage so it survives reloads — keyed by
 * connection+schema+group so different schemas don't share state.
 */
function useGroupExpanded(storageKey: string, defaultExpanded: boolean) {
  const fullKey = `schema-group:${storageKey}`
  const [expanded, setExpandedState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      return raw === null ? defaultExpanded : raw === '1'
    } catch {
      return defaultExpanded
    }
  })
  const setExpanded = (next: boolean) => {
    setExpandedState(next)
    try { localStorage.setItem(fullKey, next ? '1' : '0') } catch { /* quota */ }
  }
  return [expanded, setExpanded] as const
}

function GroupHeader({
  label,
  count,
  expanded,
  onToggle,
  icon,
  paddingLeft
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  icon: ReactNode
  paddingLeft: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full flex items-center gap-1.5 py-0.5 text-left transition-colors duration-[var(--transition-fast)]"
      style={{ paddingLeft, paddingRight: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {expanded
        ? <ChevronDown size={10} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        : <ChevronRight size={10} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
      {icon}
      <span
        className="uppercase tracking-wider opacity-60 text-[10px] font-medium flex-1 truncate"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
      <span
        className="text-[10px] opacity-50 tabular-nums"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {count}
      </span>
    </button>
  )
}

/** Generic collapsible group; children are the rendered rows. Used for Tables/Views. */
function SchemaGroup({
  storageKey,
  label,
  count,
  icon,
  headerPaddingLeft,
  defaultExpanded = false,
  children
}: {
  storageKey: string
  label: string
  count: number
  icon: ReactNode
  headerPaddingLeft: number
  defaultExpanded?: boolean
  children: ReactNode
}) {
  const [expanded, setExpanded] = useGroupExpanded(storageKey, defaultExpanded)
  const filterText = useSchemaStore((s) => s.filterText)
  if (count === 0) return null
  const showExpanded = expanded || Boolean(filterText)
  return (
    <div>
      <GroupHeader
        label={label}
        count={count}
        expanded={showExpanded}
        onToggle={() => setExpanded(!expanded)}
        icon={icon}
        paddingLeft={headerPaddingLeft}
      />
      {showExpanded && children}
    </div>
  )
}

/** Collapsible group for flat lists of objects (functions, indexes, etc.). */
function SchemaObjectGroup({
  storageKey,
  label,
  items,
  icon,
  headerPaddingLeft,
  itemPaddingLeft,
}: {
  storageKey: string
  label: string
  items: SchemaObjectGroupItem[]
  icon: ReactNode
  headerPaddingLeft: number
  itemPaddingLeft: number
}) {
  const [expanded, setExpanded] = useGroupExpanded(storageKey, false)
  const filterText = useSchemaStore((s) => s.filterText)
  if (items.length === 0) return null
  // Auto-expand when actively searching, so matches are visible without manual clicks.
  const showExpanded = expanded || Boolean(filterText)
  return (
    <div>
      <GroupHeader
        label={label}
        count={items.length}
        expanded={showExpanded}
        onToggle={() => setExpanded(!expanded)}
        icon={icon}
        paddingLeft={headerPaddingLeft}
      />
      {showExpanded && items.map((it) => (
        <div
          key={it.key}
          className="flex items-center gap-1.5 text-xs py-0.5 min-w-0"
          style={{ paddingLeft: itemPaddingLeft, color: 'var(--color-text-secondary)' }}
          title={it.sub ? `${it.label} ${it.sub}` : it.label}
        >
          <span className="truncate min-w-0">
            <HighlightedText text={it.label} query={filterText} />
          </span>
          {it.sub && (
            <span className="opacity-50 truncate text-[10px] shrink min-w-0" style={{ fontStyle: 'italic' }}>
              {it.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
