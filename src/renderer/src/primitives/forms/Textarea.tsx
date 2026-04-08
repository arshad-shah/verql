import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const textareaVariants = cva(
  'w-full border bg-bg-tertiary text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-xs rounded',
        md: 'px-4 py-2 text-sm rounded-md',
        lg: 'px-5 py-2.5 text-sm rounded-md',
      },
      error: {
        true: 'border-error focus:ring-error',
        false: 'border-border-default',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ size, error }), className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
