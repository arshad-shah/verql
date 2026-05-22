import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const inputVariants = cva(
  'w-full border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary placeholder:text-text-muted shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-2.5 text-xs rounded',
        md: 'h-9 px-3 text-sm rounded-md',
        lg: 'h-10 px-4 text-sm rounded-md',
        xl: 'h-12 px-5 text-base rounded-lg',
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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, error }), className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
