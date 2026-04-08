import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const alertVariants = cva(
  'rounded-lg border px-4 py-3',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border-border-default text-text-primary',
        success: 'bg-success/5 border-success text-success',
        error: 'bg-error/5 border-error text-error',
        warning: 'bg-warning/5 border-warning text-warning',
        info: 'bg-info/5 border-info text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {title && <p className="font-medium text-sm">{title}</p>}
      {children && <div className="text-sm">{children}</div>}
    </div>
  )
}
