import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const inputVariants = cva(
  'w-full border bg-bg-tertiary text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
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
