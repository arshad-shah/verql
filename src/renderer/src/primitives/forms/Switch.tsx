import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        role="switch"
        ref={ref}
        aria-label={label}
        className={cn(
          'h-5 w-9 cursor-pointer appearance-none rounded-full bg-bg-tertiary transition-all duration-(--transition-fast)',
          'checked:bg-accent',
          'relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-bg-elevated before:shadow-[0_1px_3px_var(--color-overlay-strong)] before:transition-transform before:duration-[var(--transition-fast)]',
          'checked:before:translate-x-4',
          'focus:outline-none focus:shadow-focus-glow',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

Switch.displayName = 'Switch'
