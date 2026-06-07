import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const breadcrumbVariants = cva('', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface BreadcrumbProps extends VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className, size }: BreadcrumbProps) {
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
                <span className={cn(breadcrumbVariants({ size }), 'text-text-primary')}>{item.label}</span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    breadcrumbVariants({ size }),
                    'text-text-secondary hover:text-text-primary transition-colors duration-[var(--transition-fast)]'
                  )}
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
