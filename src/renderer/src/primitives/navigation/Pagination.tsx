import React from 'react'
import { cn } from '../utils/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors duration-[var(--transition-fast)]"
      >
        ‹
      </button>
      <span className="text-sm text-text-primary">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 text-sm disabled:opacity-50 disabled:pointer-events-none transition-colors duration-[var(--transition-fast)]"
      >
        ›
      </button>
    </nav>
  )
}
