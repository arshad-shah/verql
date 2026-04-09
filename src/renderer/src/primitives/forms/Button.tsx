import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-glow)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent-emphasis text-white hover:bg-accent shadow-[inset_0_1px_0_var(--color-button-highlight),0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_var(--color-button-highlight),0_2px_4px_rgba(0,0,0,0.25)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
        outline:
          'border border-border-default bg-transparent hover:bg-hover hover:border-border-strong text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
        danger: 'bg-error-emphasis text-white hover:bg-error shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-2.5 text-xs rounded',
        md: 'h-9 px-3 text-sm rounded-md',
        lg: 'h-10 px-4 text-sm rounded-md',
        xl: 'h-12 px-5 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-glow)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent-emphasis text-white hover:bg-accent shadow-[inset_0_1px_0_var(--color-button-highlight),0_1px_2px_rgba(0,0,0,0.2)]',
        outline: 'border border-border-default bg-transparent hover:bg-hover hover:border-border-strong text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
      },
      size: {
        xs: 'h-7 w-7 rounded',
        sm: 'h-8 w-8 rounded',
        md: 'h-9 w-9 rounded-md',
        lg: 'h-10 w-10 rounded-md',
        xl: 'h-12 w-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'
