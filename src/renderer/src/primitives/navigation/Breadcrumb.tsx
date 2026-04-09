import React from 'react'
import { cn } from '../utils/cn'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-muted">/</span>
              )}
              {isLast ? (
                <span className="text-sm text-text-primary">{item.label}</span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-[var(--transition-fast)]"
                >
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
