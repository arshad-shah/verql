import React from 'react'
import { cn } from '../utils/cn'

export interface ProgressProps {
  value: number
  max?: number
  className?: string
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden shadow-[var(--shadow-input-inset)]',
        className
      )}
    >
      <div
        className="h-full bg-accent rounded-full transition-all duration-[var(--transition-normal)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
