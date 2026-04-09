import { Table2, Eye, Key, Link, Hash, Database, FolderOpen } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'

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

export function DatabaseIcon() {
  return <Database size={14} className="text-info shrink-0" />
}

export function SchemaIcon() {
  return <FolderOpen size={14} className="text-warning shrink-0" />
}
