import { ChevronRight, ChevronDown, Table2, Eye, Key, Link, Hash } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'
import { Text, Box, Flex } from '@/primitives'

interface Props {
  label: string
  icon?: React.ReactNode
  depth?: number
  expanded?: boolean
  onToggle?: () => void
  onClick?: () => void
  actions?: React.ReactNode
  children?: React.ReactNode
  meta?: string
}

export function SchemaTreeItem({ label, icon, depth = 0, expanded, onToggle, onClick, actions, children, meta }: Props) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 14

  return (
    <Box>
      <Flex
        align="center"
        gap="xs"
        onClick={() => { onToggle?.(); onClick?.() }}
        className="group py-0.5 px-1 cursor-pointer text-xs hover:bg-white/5 rounded transition-colors"
        style={{ paddingLeft }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="text-text-muted shrink-0" /> : <ChevronRight size={12} className="text-text-muted shrink-0" />
        ) : (
          <Box as="span" className="w-3 shrink-0" />
        )}
        {icon && <Box as="span" className="shrink-0">{icon}</Box>}
        <Text size="xs" color="secondary" truncate className="flex-1">{label}</Text>
        {meta && <Text size="xs" color="muted" className="text-[9px] shrink-0">{meta}</Text>}
        {actions && <Flex as="span" align="center" gap="xs" className="shrink-0">{actions}</Flex>}
      </Flex>
      {expanded && children && <Box>{children}</Box>}
    </Box>
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

export function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}
