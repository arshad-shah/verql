import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'py-6',
        md: 'py-12',
        lg: 'py-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, size, className }: EmptyStateProps) {
  return (
    <div
      className={cn(emptyStateVariants({ size }), className)}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
