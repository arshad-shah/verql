import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const paginationButtonVariants = cva(
  'disabled:opacity-50 disabled:pointer-events-none transition-colors duration-[var(--transition-fast)]',
  {
    variants: {
      size: {
        sm: 'text-xs px-1 py-0.5',
        md: 'text-sm px-2 py-1',
        lg: 'text-base px-3 py-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const paginationLabelVariants = cva('text-text-primary', {
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

export interface PaginationProps extends VariantProps<typeof paginationButtonVariants> {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  'aria-label'?: string
}

export function Pagination({ page, totalPages, onPageChange, className, size, 'aria-label': ariaLabel }: PaginationProps) {
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <nav aria-label={ariaLabel ?? 'Pagination'} className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        className={paginationButtonVariants({ size })}
      >
        <ChevronLeft size={14} />
      </button>
      <span className={paginationLabelVariants({ size })}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        className={paginationButtonVariants({ size })}
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
