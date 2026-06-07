import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const progressVariants = cva(
  'w-full bg-bg-elevated rounded-full overflow-hidden shadow-[var(--shadow-input-inset)]',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-1.5',
        lg: 'h-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface ProgressProps extends VariantProps<typeof progressVariants> {
  value: number
  max?: number
  className?: string
  'aria-label'?: string
}

export function Progress({
  value,
  max = 100,
  size,
  className,
  'aria-label': ariaLabel,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      className={cn(progressVariants({ size }), className)}
    >
      <div
        className="h-full bg-accent rounded-full transition-all duration-[var(--transition-normal)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
