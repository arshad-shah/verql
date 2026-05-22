import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const textareaVariants = cva(
  'w-full border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary placeholder:text-text-muted shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] disabled:pointer-events-none disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'px-2.5 py-2 text-xs rounded',
        md: 'px-3 py-2.5 text-sm rounded-md',
        lg: 'px-4 py-3 text-sm rounded-md',
      },
      error: {
        true: 'border-error focus:shadow-[var(--shadow-error-ring),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
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
