import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { fieldSizeVariants } from './field-variants'

const inputVariants = cva(
  [
    'w-full border text-text-primary placeholder:text-text-muted',
    'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
    'shadow-[var(--shadow-input-inset)]',
    'h-[var(--field-ctl-h)] px-[var(--field-px)] text-[length:var(--field-ctl-fs)] rounded-[var(--field-ctl-r)]',
    'transition-all duration-[var(--transition-fast)] motion-reduce:transition-none',
    'focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: fieldSizeVariants,
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
