import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const selectVariants = cva(
  'w-full appearance-none border border-border-default bg-bg-tertiary text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(selectVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Select.displayName = 'Select'
