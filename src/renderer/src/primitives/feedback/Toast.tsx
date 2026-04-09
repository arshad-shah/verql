import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

const toastVariants = cva(
  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm shadow-[var(--shadow-elevated)] toast-enter',
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

export interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string
  onDismiss: () => void
  className?: string
}

export function Toast({ message, onDismiss, variant, className }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)}>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="inline-flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  )
}
