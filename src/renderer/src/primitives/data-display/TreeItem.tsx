import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

const treeItemRowVariants = cva(
  'flex items-center gap-1.5 cursor-pointer rounded transition-colors duration-[var(--transition-fast)] group',
  {
    variants: {
      size: {
        sm: 'py-0.5 px-1 text-xs',
        md: 'py-1 px-2 text-sm',
      },
      selected: {
        true: 'bg-accent/10 text-accent',
        false: 'hover:bg-hover text-text-secondary',
      },
    },
    defaultVariants: { size: 'sm', selected: false },
  }
)

export interface TreeItemProps extends VariantProps<typeof treeItemRowVariants> {
  label: string
  icon?: React.ReactNode
  depth?: number
  expanded?: boolean
  onToggle?: () => void
  meta?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function TreeItem({
  label,
  icon,
  depth = 0,
  expanded,
  onToggle,
  selected,
  meta,
  actions,
  children,
  size,
  className,
}: TreeItemProps) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 16

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle?.()
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(treeItemRowVariants({ size, selected }))}
        style={{ paddingLeft }}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        tabIndex={onToggle ? 0 : undefined}
        role={onToggle ? 'treeitem' : undefined}
        aria-expanded={onToggle ? expanded : undefined}
      >
        {onToggle ? (
          expanded ? (
            <ChevronDown size={12} className="text-text-muted shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-text-muted shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{label}</span>
        {meta && <span className="shrink-0 text-text-muted text-[9px]">{meta}</span>}
        {actions && (
          <span
            className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </div>
      {expanded && hasChildren && <div>{children}</div>}
    </div>
  )
}
