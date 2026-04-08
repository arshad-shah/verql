import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent text-accent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  label?: string
  className?: string
}

export function Spinner({ size, label = 'Loading', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), className)}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}
