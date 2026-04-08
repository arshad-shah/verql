import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent text-white hover:bg-accent-hover',
        outline:
          'border border-border-default bg-transparent hover:bg-hover text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
        danger: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
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
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent text-white hover:bg-accent-hover',
        outline: 'border border-border-default bg-transparent hover:bg-hover text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
      },
      size: {
        xs: 'h-6 w-6 rounded',
        sm: 'h-7 w-7 rounded',
        md: 'h-8 w-8 rounded-md',
        lg: 'h-9 w-9 rounded-md',
        xl: 'h-10 w-10 rounded-lg',
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
