import { ChevronRight, ChevronDown, Table2, Eye, Key, Link, Hash } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'

interface Props {
  label: string
  icon?: React.ReactNode
  depth?: number
  expanded?: boolean
  onToggle?: () => void
  onClick?: () => void
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function SchemaTreeItem({ label, icon, depth = 0, expanded, onToggle, onClick, actions, children }: Props) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 14

  return (
    <div>
      <div
        onClick={() => { onToggle?.(); onClick?.() }}
        className="group flex items-center gap-1.5 py-0.5 px-1 cursor-pointer text-xs hover:bg-white/5 rounded transition-colors"
        style={{ paddingLeft }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="text-text-muted shrink-0" /> : <ChevronRight size={12} className="text-text-muted shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate text-text-secondary flex-1">{label}</span>
        {actions && <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">{actions}</span>}
      </div>
      {expanded && children && <div>{children}</div>}
    </div>
  )
}

export function TableIcon({ type }: { type: 'table' | 'view' }) {
  return type === 'view'
    ? <Eye size={12} className="text-info" />
    : <Table2 size={12} className="text-accent" />
}

export function ColumnIcon({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) return <Key size={11} className="text-warning" />
  if (column.isForeignKey) return <Link size={11} className="text-info" />
  return <Hash size={11} className="text-text-muted" />
}
