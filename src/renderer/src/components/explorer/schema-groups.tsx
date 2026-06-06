// Collapsible schema-category group primitives, extracted from SchemaNode so the
// node component stays focused on data loading + layout. Pure presentational
// pieces driven by props; expanded state persists per connection+schema+group.
import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { HighlightedText } from './HighlightedText'

export interface SchemaObjectGroupItem {
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
export function SchemaGroup({
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
export function SchemaObjectGroup({
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
