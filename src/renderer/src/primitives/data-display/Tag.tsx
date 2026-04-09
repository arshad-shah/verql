import React from 'react'
import { cn } from '../utils/cn'

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onDismiss?: () => void
}

export function Tag({ className, children, onDismiss, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-bg-elevated text-text-secondary border border-border-default transition-all duration-[var(--transition-fast)]',
        className
      )}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onDismiss}
          className="inline-flex items-center justify-center leading-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
