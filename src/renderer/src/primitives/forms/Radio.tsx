import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const radioVariants = cva(
  cn(
    // Base: hidden native appearance (size-independent)
    'relative cursor-pointer appearance-none rounded-full border border-border-default',
    'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
    'shadow-input-inset',
    'transition-all duration-(--transition-fast)',
    // Hover
    'hover:border-border-strong',
    // Checked
    'checked:bg-accent checked:border-accent checked:shadow-none',
    'checked:hover:brightness-110',
    // Focus
    'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
    'checked:focus:shadow-focus-glow',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Dot pseudo-element — position is size-independent
    'before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2',
    'before:rounded-full before:bg-text-inverse',
    'before:opacity-0 before:scale-0',
    'before:transition-all before:duration-(--transition-fast)',
    // Dot visible on checked
    'checked:before:opacity-100 checked:before:scale-100'
  ),
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 before:h-1 before:w-1',
        md: 'h-4 w-4 before:h-1.5 before:w-1.5',
        lg: 'h-5 w-5 before:h-2 before:w-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        className={cn(radioVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Radio.displayName = 'Radio'
